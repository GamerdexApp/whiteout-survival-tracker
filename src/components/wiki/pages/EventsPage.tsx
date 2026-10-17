"use client";

import type { GameEvent } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	categoryCounts,
	filterEvents,
	SCORING_FILTER_IDS,
	scoringParts,
} from "@/service/wikiEvents";
import type { EventCategoryFilter, ScoringFilter } from "@/service/wikiEvents";
import { allGameEvents, gameEventById } from "@/data/game/gameEvents";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { EventDetail } from "../events/EventDetail";
import { FilterChips } from "../parts/FilterChips";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

function ScoringRowsValue({ event }: { event: GameEvent }) {
	const t = useTranslations("wikiEvents");
	const parts = scoringParts(event);

	if (parts.length === 0) return <span className="text-muted">{t("list.noScoringRows")}</span>;

	return (
		<>
			{parts
				.map((part) =>
					t(`parts.${part.kind}`, { count: part.count, amount: formatNumber(part.count) })
				)
				.join(", ")}
		</>
	);
}

function EventsList() {
	const t = useTranslations("wikiEvents.list");
	const tCategory = useTranslations("wikiEvents.category");
	const tScoring = useTranslations("wikiEvents.scoring");
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<EventCategoryFilter>("all");
	const [scoring, setScoring] = useState<ScoringFilter>("any");

	const matches = filterEvents(query, category, scoring);

	return (
		<>
			<RecordSection
				title={t("title")}
				meta={t("showing", {
					shown: formatNumber(matches.length),
					total: formatNumber(allGameEvents().length),
				})}
			>
				<RecordFilters>
					<Field label={t("search")}>
						<Input
							type="search"
							placeholder={t("searchPlaceholder")}
							leadingIcon={<LuSearch size={16} />}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</Field>
					<Field label={t("scoringFilter")}>
						<Select
							value={scoring}
							onChange={(event) => setScoring(event.target.value as ScoringFilter)}
						>
							{SCORING_FILTER_IDS.map((id) => (
								<option key={id} value={id}>
									{tScoring(id)}
								</option>
							))}
						</Select>
					</Field>
				</RecordFilters>
				<FilterChips
					label={t("categoryLabel")}
					value={category}
					onChange={setCategory}
					options={[
						{ id: "all", label: t("all"), count: allGameEvents().length },
						...categoryCounts().map(({ category: id, count }) => ({
							id,
							label: tCategory(id),
							count,
						})),
					]}
				/>
				{matches.length === 0 ? (
					<EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
				) : (
					<>
						<ResponsiveTable
							label={t("table")}
							titleColumnId="event"
							rows={matches}
							rowKey={(row) => row.id}
							rowHref={(row) => `/wiki/events/${encodeURIComponent(row.id)}`}
							columns={[
								{ id: "event", header: t("event"), render: (row) => row.name },
								{
									id: "category",
									header: t("category"),
									render: (row) => tCategory(row.category),
								},
								{
									id: "frequency",
									header: t("frequency"),
									render: (row) => row.frequency ?? <UnknownValue />,
								},
								{
									id: "duration",
									header: t("duration"),
									render: (row) => row.duration ?? <UnknownValue />,
								},
								{
									id: "scoring",
									header: t("scoringRows"),
									render: (row) => <ScoringRowsValue event={row} />,
									wideOnCard: true,
								},
							]}
						/>
					</>
				)}
			</RecordSection>
		</>
	);
}

function EventRecord({ recordId }: { recordId: string }) {
	const t = useTranslations("wikiEvents");
	const tCategory = useTranslations("wikiEvents.category");
	const event = gameEventById(recordId);

	if (!event) return <WikiRecordMissing id="events" />;

	return (
		<WikiPageShell
			id="events"
			recordName={event.name}
			line={t("recordLine", { category: tCategory(event.category) })}
		>
			<EventDetail event={event} />
		</WikiPageShell>
	);
}

export function EventsPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiEvents");

	if (recordId) return <EventRecord recordId={recordId} />;

	const counts = Object.fromEntries(
		categoryCounts().map(({ category, count }) => [category, formatNumber(count)])
	);

	return (
		<WikiPageShell
			id="events"
			line={t("line", {
				events: formatNumber(allGameEvents().length),
				alliance: counts.alliance,
				solo: counts.solo,
				rookie: counts.rookie,
				holiday: counts.holiday,
			})}
		>
			<EventsList />
		</WikiPageShell>
	);
}
