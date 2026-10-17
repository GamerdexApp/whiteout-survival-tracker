"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { LuLockOpen } from "react-icons/lu";
import type { CoreEventId, EventDayResultState, EventOverallState, Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import {
	calculateEvent,
	dayLabelOf,
	dayOpensLater,
	eventDaysOf,
	isBattleDay,
	lockedTotalOf,
	logOf,
	overallDaysOf,
	withDayResult,
	withEventDates,
	withOverallResult,
} from "@/service/coreEvents";
import { dayCountOf, hasEndedBeforeStart } from "@/service/eventLogView";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { DAY_ROW_COLUMNS, EventLogDayRow, ResultField } from "./EventLogDayRow";

const MAX_RANK = 9_999_999;

interface EventLogCurrentProps {
	chief: Playthrough;
	event: CoreEventId;
	onChange: (update: (chief: Playthrough) => Playthrough) => void;
}

export function EventLogCurrent({ chief, event, onChange }: EventLogCurrentProps) {
	const t = useTranslations("eventLog");
	const now = useNow();
	const log = logOf(chief, event);
	const plan = useMemo(() => calculateEvent(chief, event), [chief, event]);
	const days = eventDaysOf(event, chief);
	const preparationDays = overallDaysOf(event, chief);
	const battleDay = days.find((day) => isBattleDay(event, day.id));
	const daysTitle =
		event === "svs"
			? t("cards.svsDays")
			: event === "hall"
				? t("cards.stages")
				: t("cards.days");

	const rowOf = (dayId: string) => {
		const name = dayLabelOf(event, dayId);
		return (
			<EventLogDayRow
				key={dayId}
				name={name}
				planTotal={plan.days.find((day) => day.id === dayId)?.total ?? 0}
				result={log.days?.[dayId] ?? {}}
				opensLater={dayOpensLater(chief, event, dayId, now)}
				onChange={(patch: Partial<EventDayResultState>) =>
					onChange((current) => withDayResult(current, event, dayId, patch))
				}
			/>
		);
	};

	return (
		<>
			<DatesCard chief={chief} event={event} onChange={onChange} />
			<Card className="flex flex-col p-4">
				<ResultsHeader
					title={daysTitle}
					hint={event === "svs" ? t("cards.rankHint") : undefined}
				/>
				<div className="divide-line divide-y-[1.5px]">
					{preparationDays.map((day) => rowOf(day.id))}
				</div>
			</Card>
			{battleDay && (
				<Card className="flex flex-col p-4">
					<ResultsHeader title={t("cards.battleTitle")} hint={t("cards.battleNote")} />
					{rowOf(battleDay.id)}
				</Card>
			)}
			<OverallCard chief={chief} event={event} onChange={onChange} />
		</>
	);
}

function ResultsHeader({ title, hint }: { title: string; hint?: string }) {
	const t = useTranslations("eventLog.results");

	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h3 className="font-semibold">{title}</h3>
				{hint && <p className="text-muted text-xs">{hint}</p>}
			</div>
			<div
				aria-hidden="true"
				className={`text-muted mt-2 hidden font-mono text-[11px] tracking-[0.08em] uppercase lg:grid lg:gap-3 ${DAY_ROW_COLUMNS}`}
			>
				<span />
				<span className="text-end">{t("score")}</span>
				<span className="text-end">{t("rank")}</span>
				<span className="text-end">{t("alliance")}</span>
				<span />
			</div>
		</div>
	);
}

function DatesCard({ chief, event, onChange }: EventLogCurrentProps) {
	const t = useTranslations("eventLog.dates");
	const { start, end } = logOf(chief, event);
	const count = dayCountOf(start, end);

	const changeDates = (nextStart: string | undefined, nextEnd: string | undefined) =>
		onChange((current) => withEventDates(current, event, nextStart, nextEnd));

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{t("title")}</h3>
				{count !== null && (
					<span className="text-muted font-mono text-xs">
						{t("days", { count, amount: formatNumber(count) })}
					</span>
				)}
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Field label={t("start")}>
					<Input
						type="date"
						value={start ?? ""}
						onChange={(input) => changeDates(input.target.value || undefined, end)}
					/>
				</Field>
				<Field
					label={t("end")}
					error={hasEndedBeforeStart(start, end) ? t("endBeforeStart") : undefined}
				>
					<Input
						type="date"
						value={end ?? ""}
						onChange={(input) => changeDates(start, input.target.value || undefined)}
					/>
				</Field>
			</div>
		</Card>
	);
}

function OverallCard({ chief, event, onChange }: EventLogCurrentProps) {
	const t = useTranslations("eventLog.overall");
	const tr = useTranslations("eventLog.results");
	const overall = logOf(chief, event).overall ?? {};
	const locked = overall.locked === true;
	const totalLabel =
		event === "svs" ? t("svsTotal") : event === "hall" ? t("stagesTotal") : t("daysTotal");

	const changeOverall = (patch: Partial<EventOverallState>) =>
		onChange((current) => withOverallResult(current, event, patch));

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">{event === "svs" ? t("svsTitle") : t("title")}</h3>
				{locked ? (
					<div className="flex items-center gap-3">
						<Badge tone="locked">{tr("locked")}</Badge>
						<button
							type="button"
							onClick={() => changeOverall({ locked: false })}
							className="text-link text-sm underline"
						>
							{tr("unlock")}
						</button>
					</div>
				) : (
					<Button onClick={() => changeOverall({ locked: true })}>
						<LuLockOpen size={14} aria-hidden="true" />
						{tr("lock")}
					</Button>
				)}
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1.5">
					<span className="font-medium">{t("rank")}</span>
					<ResultField
						label=""
						ariaLabel={t("rank")}
						placeholder={tr("rank")}
						max={MAX_RANK}
						value={overall.rank}
						disabled={false}
						locked={locked}
						onCommit={(rank) => changeOverall({ rank })}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="font-medium">{t("alliance")}</span>
					<ResultField
						label=""
						ariaLabel={t("alliance")}
						placeholder={tr("rank")}
						max={MAX_RANK}
						value={overall.allianceRank}
						disabled={false}
						locked={locked}
						onCommit={(allianceRank) => changeOverall({ allianceRank })}
					/>
				</div>
			</div>
			<div className="border-line flex items-baseline justify-between gap-3 border-t-[1.5px] pt-3">
				<span>{totalLabel}</span>
				<span className="font-mono text-base font-semibold">
					{formatNumber(lockedTotalOf(chief, event))}
				</span>
			</div>
			<p className="text-muted text-xs">{t("hint")}</p>
		</Card>
	);
}
