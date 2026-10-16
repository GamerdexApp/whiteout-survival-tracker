"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type { CoreEventId, EventHistoryEntry, Playthrough } from "@/types/app";
import { formatNumber, formatShortDate } from "@/lib/format";
import { dayLabelOf, eventDaysOf, historyOf, isBattleDay } from "@/service/coreEvents";
import { formatTypedDate } from "@/service/eventLogView";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

interface EventHistoryListProps {
	chief: Playthrough;
	event: CoreEventId;
	onRemove: (entry: EventHistoryEntry) => void;
}

export function EventHistoryList({ chief, event, onRemove }: EventHistoryListProps) {
	const t = useTranslations("eventLog");
	const entries = historyOf(chief, event);

	return (
		<>
			<p className="text-muted text-sm">
				{t.rich("history.intro", {
					event: t(`eventShort.${event}`),
					link: (text) => (
						<Link href="/history" className="text-link underline">
							{text}
						</Link>
					),
				})}
			</p>
			{entries.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("history.empty")}</p>
				</Card>
			) : (
				entries.map((entry) => (
					<HistoryCard
						key={entry.id}
						chief={chief}
						event={event}
						entry={entry}
						onRemove={() => onRemove(entry)}
					/>
				))
			)}
		</>
	);
}

interface HistoryCardProps {
	chief: Playthrough;
	event: CoreEventId;
	entry: EventHistoryEntry;
	onRemove: () => void;
}

function HistoryCard({ chief, event, entry, onRemove }: HistoryCardProps) {
	const t = useTranslations("eventLog.history");
	const [expanded, setExpanded] = useState(false);
	const days = eventDaysOf(event, chief);
	const preparationDays = days.filter((day) => !isBattleDay(event, day.id));
	const battleDay = days.find((day) => isBattleDay(event, day.id));
	const tc = useTranslations("eventLog");
	const eventName = tc(`eventShort.${event}`);
	const title =
		entry.start && entry.end
			? t("cardTitle", {
					event: eventName,
					start: formatTypedDate(entry.start),
					end: formatTypedDate(entry.end),
				})
			: t("cardNoDates", { event: eventName });

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h3 className="font-semibold">{title}</h3>
				<span className="text-muted text-xs">
					{t("ended", { date: formatShortDate(entry.endedAt) })}
				</span>
			</div>
			<dl className="grid grid-cols-3 gap-3">
				<Stat label={event === "svs" ? t("svsTotal") : t("total")} mono>
					{formatNumber(entry.totalScore)}
				</Stat>
				<Stat label={t("overallRank")} mono={entry.overall.rank !== undefined}>
					{entry.overall.rank === undefined
						? t("notSet")
						: formatNumber(entry.overall.rank)}
				</Stat>
				<Stat label={t("allianceRank")} mono={entry.overall.allianceRank !== undefined}>
					{entry.overall.allianceRank === undefined
						? t("notSet")
						: formatNumber(entry.overall.allianceRank)}
				</Stat>
			</dl>
			{expanded && (
				<div className="flex flex-col">
					<HistoryColumns />
					<div className="divide-line divide-y-[1.5px]">
						{preparationDays.map((day) => (
							<HistoryDayRow
								key={day.id}
								name={dayLabelOf(event, day.id)}
								entry={entry}
								dayId={day.id}
							/>
						))}
					</div>
					{battleDay && (
						<div className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
							<p className="text-muted text-xs">{tc("cards.battleNote")}</p>
							<HistoryDayRow
								name={dayLabelOf(event, battleDay.id)}
								entry={entry}
								dayId={battleDay.id}
							/>
						</div>
					)}
				</div>
			)}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
					{expanded ? t("hideDays") : t("showDays")}
				</Button>
				<Button variant="danger" onClick={onRemove}>
					{t("remove")}
				</Button>
			</div>
		</Card>
	);
}

function Stat({ label, mono, children }: { label: string; mono?: boolean; children: string }) {
	return (
		<div className="flex min-w-0 flex-col gap-0.5">
			<dt className="text-muted text-xs">{label}</dt>
			<dd className={`text-base font-semibold ${mono ? "font-mono" : ""}`}>{children}</dd>
		</div>
	);
}

function HistoryDayRow({
	name,
	entry,
	dayId,
}: {
	name: string;
	entry: EventHistoryEntry;
	dayId: string;
}) {
	const t = useTranslations("eventLog");
	const result = entry.days[dayId];
	const text = (value: number | undefined) =>
		value === undefined ? t("history.noValue") : formatNumber(value);

	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto_3.5rem_3.5rem] items-center gap-3 py-2.5">
			<span>{name}</span>
			<span className="text-right font-mono">{text(result?.score)}</span>
			<span className="text-right font-mono">{text(result?.rank)}</span>
			<span className="text-right font-mono">{text(result?.allianceRank)}</span>
		</div>
	);
}

function HistoryColumns() {
	const t = useTranslations("eventLog.results");

	return (
		<div
			aria-hidden="true"
			className="text-muted grid grid-cols-[minmax(0,1fr)_auto_3.5rem_3.5rem] gap-3 pb-1 font-mono text-[11px] tracking-[0.08em] uppercase"
		>
			<span />
			<span className="text-right">{t("score")}</span>
			<span className="text-right">{t("rank")}</span>
			<span className="text-right">{t("allianceShort")}</span>
		</div>
	);
}
