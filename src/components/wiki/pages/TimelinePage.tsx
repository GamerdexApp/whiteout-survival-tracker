"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { serverAgeOf } from "@/service/overviewEvents";
import { wikiTimelineRows } from "@/data/game/wikiTimeline";
import type { TimelineLineKind } from "@/data/game/wikiTimeline";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Field } from "@/comps/ui/Field";
import { Note } from "@/comps/ui/Note";
import { Select } from "@/comps/ui/Select";
import { TimelineMarker, TimelineRowView, WINDOW_DAYS } from "../timeline/TimelineRow";
import type { RowPhase } from "../timeline/TimelineRow";
import { WikiBreadcrumb } from "../WikiBreadcrumb";

type FilterId = "events" | "features" | "pets" | "experts" | "heroes";

const FILTER_IDS: FilterId[] = ["events", "features", "pets", "experts", "heroes"];

const FILTER_OF_KIND: Record<TimelineLineKind, FilterId> = {
	event: "events",
	feature: "features",
	pets: "pets",
	experts: "experts",
};

const allVisible = (): Record<FilterId, boolean> => ({
	events: true,
	features: true,
	pets: true,
	experts: true,
	heroes: true,
});

const countOf = (filter: FilterId) =>
	wikiTimelineRows.reduce(
		(total, row) =>
			total +
			(filter === "heroes"
				? row.heroGenerations.length
				: row.lines.filter((line) => FILTER_OF_KIND[line.kind] === filter).length),
		0
	);

const COUNTS = Object.fromEntries(FILTER_IDS.map((id) => [id, countOf(id)])) as Record<
	FilterId,
	number
>;

const phaseOf = (day: number, age: number | null): RowPhase => {
	if (age === null) return "unknown";
	if (day < age - WINDOW_DAYS) return "past";
	if (day <= age + WINDOW_DAYS) return "near";
	return "future";
};

export function TimelinePage() {
	const t = useTranslations("wikiTimeline");
	const tWiki = useTranslations("wiki");
	const { playthroughs, activePlaythrough } = usePlaythrough();
	const now = useNow();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [visible, setVisible] = useState(allVisible);
	const markerRef = useRef<HTMLLIElement>(null);

	const chief: Playthrough | null =
		playthroughs.find((candidate) => candidate.id === selectedId) ?? activePlaythrough;
	const age = chief ? serverAgeOf(chief, now).days : null;
	const windowFrom = age === null ? 0 : Math.max(0, age - WINDOW_DAYS);
	const windowTo = age === null ? 0 : age + WINDOW_DAYS;

	const shownRows = wikiTimelineRows
		.map((row) => ({
			...row,
			lines: row.lines.filter((line) => visible[FILTER_OF_KIND[line.kind]]),
			heroGenerations: visible.heroes ? row.heroGenerations : [],
		}))
		.filter((row) => row.lines.length > 0 || row.heroGenerations.length > 0);
	const markerIndex = age === null ? -1 : shownRows.findIndex((row) => row.day > age);
	const markerPosition = age === null ? -1 : markerIndex === -1 ? shownRows.length : markerIndex;

	const optionLabelOf = (candidate: Playthrough) => {
		const days = serverAgeOf(candidate, now).days;
		return days === null
			? t("place.optionNoDate", { name: candidate.name })
			: t("place.option", {
					name: candidate.name,
					days: formatNumber(days),
					window: formatNumber(WINDOW_DAYS),
				});
	};

	const jumpToMarker = () => markerRef.current?.scrollIntoView({ block: "center" });

	const first = wikiTimelineRows[0].day;
	const last = wikiTimelineRows[wikiTimelineRows.length - 1].day;

	return (
		<>
			<header className="flex flex-col gap-1">
				<WikiBreadcrumb steps={[{ label: t("title") }]} />
				<h1 className="text-2xl font-semibold">{t("title")}</h1>
				<p className="text-muted">{t("subline")}</p>
				<p className="text-muted">
					{t("line", {
						rows: wikiTimelineRows.length,
						amount: formatNumber(wikiTimelineRows.length),
						first: formatNumber(first),
						last: formatNumber(last),
					})}
				</p>
			</header>

			<section className="bg-surface border-line flex flex-col gap-4 rounded-md border-[1.5px] p-4">
				{chief && (
					<div className="flex flex-col gap-3 lg:flex-row lg:items-end">
						<div className="lg:flex-1">
							<Field label={t("place.label")}>
								<Select
									value={chief.id}
									onChange={(event) => setSelectedId(event.target.value)}
								>
									{playthroughs.map((candidate) => (
										<option key={candidate.id} value={candidate.id}>
											{optionLabelOf(candidate)}
										</option>
									))}
								</Select>
							</Field>
						</div>
						<Button variant="secondary" disabled={age === null} onClick={jumpToMarker}>
							{t("place.jump")}
						</Button>
					</div>
				)}
				<div role="group" aria-label={t("filters.label")} className="flex flex-wrap gap-2">
					{FILTER_IDS.map((id) => (
						<CheckChip
							key={id}
							label={t(`filters.${id}`, { amount: formatNumber(COUNTS[id]) })}
							checked={visible[id]}
							onChange={(checked) => setVisible({ ...visible, [id]: checked })}
						/>
					))}
				</div>
				<p className="text-muted">{t("help", { window: formatNumber(WINDOW_DAYS) })}</p>
				{!chief && (
					<Note>
						{t("noChief")}{" "}
						<Link href="/chiefs" className="text-link underline">
							{t("addChief")}
						</Link>
					</Note>
				)}
				{chief && age === null && (
					<Note>
						{t("noStartDate", { name: chief.name })}{" "}
						<Link href="/chiefs" className="text-link underline">
							{t("editChief")}
						</Link>
					</Note>
				)}
			</section>

			{shownRows.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<>
					<div
						aria-hidden="true"
						className="text-muted grid grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] font-mono text-xs uppercase max-lg:hidden"
					>
						<span className="pe-4 text-end">{t("columns.left")}</span>
						<span />
						<span className="ps-4">{t("columns.right")}</span>
					</div>
					<ol className="flex flex-col">
						{shownRows.map((row, index) => (
							<Fragment key={row.day}>
								{index === markerPosition && chief && age !== null && (
									<TimelineMarker
										markerRef={markerRef}
										name={chief.name}
										days={age}
										from={windowFrom}
										to={windowTo}
									/>
								)}
								<TimelineRowView
									row={row}
									phase={phaseOf(row.day, age)}
									daysLeft={age === null ? 0 : row.day - age}
								/>
							</Fragment>
						))}
						{markerPosition === shownRows.length && chief && age !== null && (
							<TimelineMarker
								markerRef={markerRef}
								name={chief.name}
								days={age}
								from={windowFrom}
								to={windowTo}
							/>
						)}
					</ol>
				</>
			)}
			<p className="text-muted text-xs">{t("source")}</p>
		</>
	);
}
