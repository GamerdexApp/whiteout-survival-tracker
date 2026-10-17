"use client";

import type { Decoration } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	buffTextOf,
	categoryCounts,
	COST_FILTER_IDS,
	decorationCostKind,
	filterDecorations,
	maxLevelOf,
} from "@/service/wikiDaybreak";
import type { DecorationCategoryFilter, DecorationCostFilter } from "@/service/wikiDaybreak";
import { allDecorations, lumberCampLevels, treeOfLifeLevels } from "@/data/game/daybreak";
import { findItem } from "@/data/game/items";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { DetailRows } from "../parts/DetailRows";
import { FilterChips } from "../parts/FilterChips";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

function DecorationCost({ decoration }: { decoration: Decoration }) {
	const t = useTranslations("wikiDaybreak");
	const kind = decorationCostKind(decoration);

	if (kind === "lifeEssence") {
		return (
			<>{t("cost.lifeEssence", { amount: formatNumber(decoration.lifeEssenceCost ?? 0) })}</>
		);
	}
	if (kind === "items") {
		return (
			<span className="flex flex-wrap gap-x-3 gap-y-1">
				{decoration.cost?.map((cost) => {
					const item = findItem(cost.itemId);
					return (
						<span key={cost.itemId} className="inline-flex items-center gap-1.5">
							<ItemIcon src={item?.img} size={16} />
							{formatNumber(cost.amount)} {item?.name ?? cost.itemId}
						</span>
					);
				})}
			</span>
		);
	}
	if (kind === "limited") return <>{t("cost.limited")}</>;
	return <UnknownValue />;
}

function BuffValue({ buff }: { buff: { stat: string; value: string } | undefined }) {
	const text = buff && buffTextOf(buff);
	return text ? <>{text}</> : <UnknownValue />;
}

function LumberCampCard() {
	const t = useTranslations("wikiDaybreak.lumberCamp");

	return (
		<RecordSection
			title={t("title")}
			meta={t("levels", {
				count: lumberCampLevels.length,
				amount: formatNumber(lumberCampLevels.length),
			})}
		>
			<ResponsiveTable
				label={t("table")}
				titleColumnId="level"
				rows={lumberCampLevels}
				rowKey={(row) => row.id}
				columns={[
					{ id: "level", header: t("level"), render: (row) => row.level, numeric: true },
					{
						id: "workers",
						header: t("workers"),
						render: (row) => row.workers,
						numeric: true,
					},
					{
						id: "rate",
						header: t("perSecond"),
						render: (row) => formatNumber(row.ratePerSecond),
						numeric: true,
					},
					{
						id: "tree",
						header: t("treeLevel"),
						render: (row) => row.treeOfLifeLevelRequired,
						numeric: true,
					},
					{
						id: "essence",
						header: t("lifeEssence"),
						render: (row) => formatNumber(row.lifeEssenceRequired),
						numeric: true,
					},
				]}
			/>
		</RecordSection>
	);
}

function TreeOfLifeCard() {
	const t = useTranslations("wikiDaybreak.tree");
	const tLumber = useTranslations("wikiDaybreak.lumberCamp");

	return (
		<RecordSection
			title={t("title")}
			meta={tLumber("levels", {
				count: treeOfLifeLevels.length,
				amount: formatNumber(treeOfLifeLevels.length),
			})}
		>
			<ResponsiveTable
				label={t("table")}
				titleColumnId="level"
				rows={treeOfLifeLevels}
				rowKey={(row) => row.id}
				columns={[
					{ id: "level", header: t("level"), render: (row) => row.level, numeric: true },
					{
						id: "prosperity",
						header: t("prosperity"),
						render: (row) => formatNumber(row.prosperityRequired),
						numeric: true,
					},
					{
						id: "essence",
						header: t("lifeEssence"),
						render: (row) => formatNumber(row.lifeEssenceRequired),
						numeric: true,
					},
					{
						id: "perHour",
						header: t("perHour"),
						render: (row) => formatNumber(row.lifeEssencePerHour),
						numeric: true,
					},
					{
						id: "buff",
						header: t("buff"),
						render: (row) => <BuffValue buff={row.buff} />,
						wideOnCard: true,
					},
				]}
			/>
		</RecordSection>
	);
}

function DecorationDetail({ decoration }: { decoration: Decoration }) {
	const t = useTranslations("wikiDaybreak.detail");
	const tTable = useTranslations("wikiDaybreak.decorations");
	const levels = decoration.levels;
	const prosperityAtMax = decoration.prosperityAtMaxLevel ?? maxLevelOf(decoration)?.prosperity;

	return (
		<div className="flex flex-col gap-6">
			<RecordSection title={t("title")}>
				<DetailRows
					rows={[
						{ label: t("category"), value: decoration.category },
						{
							label: t("limit"),
							value: decoration.limit ? (
								formatNumber(decoration.limit)
							) : (
								<UnknownValue />
							),
						},
						{ label: t("cost"), value: <DecorationCost decoration={decoration} /> },
						{
							label: tTable("prosperityAtMax"),
							value: prosperityAtMax ? (
								formatNumber(prosperityAtMax)
							) : (
								<UnknownValue />
							),
						},
						{
							label: t("levels"),
							value: levels?.length ? formatNumber(levels.length) : <UnknownValue />,
						},
						{
							label: t("image"),
							value: decoration.img ? (
								<ItemIcon src={decoration.img} size={48} />
							) : (
								<span className="flex items-center gap-2">
									<ItemIcon size={48} />
									{t("imageMissing")}
								</span>
							),
						},
					]}
				/>
			</RecordSection>
			<RecordSection
				title={t("levelsTitle", { name: decoration.name })}
				meta={
					levels?.length
						? t("levelsMeta", {
								count: levels.length,
								amount: formatNumber(levels.length),
							})
						: undefined
				}
			>
				{levels?.length ? (
					<ResponsiveTable
						label={t("levelsTable")}
						titleColumnId="level"
						rows={levels}
						rowKey={(row) => String(row.level)}
						columns={[
							{
								id: "level",
								header: t("level"),
								render: (row) => row.level,
								numeric: true,
							},
							{
								id: "cost",
								header: t("levelCost"),
								render: (row) => formatNumber(row.cost),
								numeric: true,
							},
							{
								id: "prosperity",
								header: t("prosperity"),
								render: (row) => formatNumber(row.prosperity),
								numeric: true,
							},
							{
								id: "buff",
								header: t("buff"),
								render: (row) => <BuffValue buff={row.buff} />,
								wideOnCard: true,
							},
						]}
					/>
				) : (
					<p className="text-muted">{t("noLevels")}</p>
				)}
			</RecordSection>
		</div>
	);
}

function DecorationsCard() {
	const t = useTranslations("wikiDaybreak.decorations");
	const tCost = useTranslations("wikiDaybreak.costFilter");
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<DecorationCategoryFilter>("all");
	const [cost, setCost] = useState<DecorationCostFilter>("any");
	const [selected, setSelected] = useState<Decoration>();

	const matches = filterDecorations(query, category, cost);

	return (
		<>
			<RecordSection
				title={t("title")}
				meta={t("showing", {
					shown: formatNumber(matches.length),
					total: formatNumber(allDecorations.length),
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
					<Field label={t("costFilter")}>
						<Select
							value={cost}
							onChange={(event) =>
								setCost(event.target.value as DecorationCostFilter)
							}
						>
							{COST_FILTER_IDS.map((id) => (
								<option key={id} value={id}>
									{tCost(id)}
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
						{ id: "all", label: t("all"), count: allDecorations.length },
						...categoryCounts()
							.toSorted((a, b) => b.count - a.count)
							.map(({ category: id, count }) => ({ id, label: id, count })),
					]}
				/>
				{matches.length === 0 ? (
					<EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
				) : (
					<>
						<ResponsiveTable
							label={t("table")}
							titleColumnId="name"
							rows={matches}
							rowKey={(row) => row.id}
							onRowSelect={setSelected}
							columns={[
								{ id: "name", header: t("name"), render: (row) => row.name },
								{
									id: "category",
									header: t("category"),
									render: (row) => row.category,
								},
								{
									id: "limit",
									header: t("limit"),
									render: (row) =>
										row.limit ? formatNumber(row.limit) : <UnknownValue />,
									numeric: true,
								},
								{
									id: "levels",
									header: t("levels"),
									render: (row) =>
										row.levels?.length ? (
											formatNumber(row.levels.length)
										) : (
											<UnknownValue />
										),
									numeric: true,
								},
								{
									id: "cost",
									header: t("cost"),
									render: (row) => <DecorationCost decoration={row} />,
									wideOnCard: true,
								},
								{
									id: "prosperity",
									header: t("prosperityAtMax"),
									render: (row) => {
										const value =
											row.prosperityAtMaxLevel ?? maxLevelOf(row)?.prosperity;
										return value ? formatNumber(value) : <UnknownValue />;
									},
									numeric: true,
								},
								{
									id: "buff",
									header: t("buffAtMax"),
									render: (row) => <BuffValue buff={maxLevelOf(row)?.buff} />,
									wideOnCard: true,
								},
							]}
						/>
					</>
				)}
			</RecordSection>
			<Flyout
				open={selected !== undefined}
				onClose={() => setSelected(undefined)}
				title={selected?.name ?? ""}
			>
				{selected && <DecorationDetail decoration={selected} />}
			</Flyout>
		</>
	);
}

export function DaybreakPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiDaybreak");

	if (recordId) return <WikiRecordMissing id="daybreak" />;

	return (
		<WikiPageShell
			id="daybreak"
			line={t("line", { decorations: formatNumber(allDecorations.length) })}
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<LumberCampCard />
				<TreeOfLifeCard />
			</div>
			<DecorationsCard />
		</WikiPageShell>
	);
}
