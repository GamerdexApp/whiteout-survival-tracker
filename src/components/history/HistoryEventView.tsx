"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	battleRowOf,
	dayRowsOf,
	findEntry,
	summaryOf,
	upgradeGroupsOf,
} from "@/service/historyEvents";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Note } from "@/comps/ui/Note";
import { SavedChip } from "@/comps/ui/SavedChip";
import { StatTile } from "@/comps/ui/StatTile";
import { DiffText } from "./DiffText";
import { BattlePhaseCard, PlanAgainstActual } from "./PlanAgainstActual";
import { PlannedUpgrades } from "./PlannedUpgrades";
import { signedPercent, useHistoryText } from "./useHistoryText";

interface HistoryEventViewProps {
	chief: Playthrough;
	event: string;
	entryId: string;
}

const BREADCRUMB_LINK =
	"text-link inline-flex min-h-11 min-w-11 items-center justify-center underline lg:min-h-9 lg:min-w-9";

export function HistoryEventView({ chief, event, entryId }: HistoryEventViewProps) {
	const t = useTranslations("history");
	const { titleOf, endedOf, rankOf } = useHistoryText();
	const found = findEntry(chief, event, entryId);

	if (!found) {
		return (
			<>
				<Breadcrumb name={t("notFound.title")} />
				<EmptyState
					title={t("notFound.title")}
					description={t("notFound.description")}
					actions={
						<ButtonLink href="/history" variant="primary">
							{t("notFound.action")}
						</ButtonLink>
					}
				/>
			</>
		);
	}

	const { event: eventId, entry } = found;
	const title = titleOf(eventId, entry);
	const summary = summaryOf(chief, eventId, entry);
	const battle = battleRowOf(chief, eventId, entry);
	const groups = upgradeGroupsOf(chief, entry);
	const daysNote = eventId === "svs" ? t("tiles.days") : undefined;

	return (
		<>
			<Breadcrumb name={title} />
			<header className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-col">
					<h1 className="text-2xl font-semibold">{title}</h1>
					<span className="text-muted">{endedOf(entry)}</span>
				</div>
				<span className="max-lg:hidden">
					<SavedChip />
				</span>
			</header>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				<StatTile
					label={t("tiles.plan")}
					value={
						<>
							{formatNumber(summary.plan)}
							<Sub text={daysNote} />
						</>
					}
				/>
				<StatTile
					label={t("tiles.actual")}
					value={
						<>
							{formatNumber(summary.actual)}
							<Sub text={daysNote} />
						</>
					}
				/>
				<StatTile
					label={t("tiles.difference")}
					value={
						<>
							<DiffText difference={summary.difference} />
							{summary.percent !== null && (
								<Sub
									text={t("tiles.percent", {
										percent: signedPercent(summary.percent),
									})}
								/>
							)}
						</>
					}
				/>
				<StatTile
					label={t("tiles.overall")}
					value={
						<>
							{rankOf(summary.rank)}
							<Sub text={daysNote ? t("tiles.rankDays") : t("tiles.rank")} />
						</>
					}
				/>
				<StatTile
					label={t("tiles.alliance")}
					value={
						<>
							{rankOf(summary.allianceRank)}
							<Sub text={daysNote ? t("tiles.rankDays") : t("tiles.rank")} />
						</>
					}
				/>
			</div>
			<PlanAgainstActual
				event={eventId}
				days={dayRowsOf(chief, eventId, entry)}
				total={summary}
			/>
			{battle && <BattlePhaseCard event={eventId} row={battle} />}
			{groups.length === 0 ? (
				<Note>{t("upgrades.none")}</Note>
			) : (
				<PlannedUpgrades chief={chief} event={eventId} groups={groups} />
			)}
		</>
	);
}

function Sub({ text }: { text: string | undefined }) {
	if (!text) return null;

	return <span className="text-muted block font-sans text-sm">{text}</span>;
}

function Breadcrumb({ name }: { name: string }) {
	const t = useTranslations("history");

	return (
		<nav aria-label={t("breadcrumb.label")} className="flex flex-wrap items-center gap-2">
			<Link href="/history" className={BREADCRUMB_LINK}>
				{t("page.title")}
			</Link>
			<span aria-hidden="true" className="text-muted">
				/
			</span>
			<span aria-current="page" className="text-muted">
				{name}
			</span>
		</nav>
	);
}
