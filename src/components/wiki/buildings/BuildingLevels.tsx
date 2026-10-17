"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDuration, formatNumber } from "@/lib/format";
import {
	LEVEL_RANGE_IDS,
	levelsInRange,
	statIdsOf,
	totalBuildSecondsOf,
	totalCostOf,
} from "@/service/wikiBuildings";
import type { LevelRangeId, StatId } from "@/service/wikiBuildings";
import { findItem } from "@/data/game/items";
import type { Building, BuildingLevel } from "@/data/game/wikiBuildings";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../tables/ResourceList";
import type { ResourceEntry } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { UnknownValue } from "../UnknownValue";

const PERCENT_STATS: StatId[] = ["trainingSpeedBonusPercent", "researchSpeedBonusPercent"];

export function BuildingLevels({ building }: { building: Building }) {
	const t = useTranslations("wikiBuildings");
	const [range, setRange] = useState<LevelRangeId>("all");
	const statIds = statIdsOf(building);

	const rangeOptions = LEVEL_RANGE_IDS.map((id) => ({
		id,
		count: levelsInRange(building, id).length,
	})).filter((option) => option.count > 0);
	const hasRangeFilter = rangeOptions.length > 2;
	const shownRange = hasRangeFilter ? range : "all";
	const rangeLevels = levelsInRange(building, shownRange);

	const costEntries = (level: BuildingLevel): ResourceEntry[] =>
		level.cost.map((cost) => ({
			itemId: cost.itemId,
			name: cost.name,
			amount: cost.count,
			suffix:
				cost.pricePerItem === undefined
					? undefined
					: t("cells.pricePerItem", { price: formatNumber(cost.pricePerItem) }),
		}));

	const requirementText = (level: BuildingLevel) =>
		level.prerequisites
			?.map((requirement) =>
				t("cells.requirement", {
					building: requirement.building,
					level: String(requirement.level),
				})
			)
			.join(", ");

	const statCell = (level: BuildingLevel, id: StatId) => {
		const value = level[id];
		if (value === undefined) return <UnknownValue />;
		if (id === "allyHelpTimeSeconds") return formatDuration(value);
		if (PERCENT_STATS.includes(id)) {
			return t("cells.percent", { value: formatNumber(value) });
		}
		return formatNumber(value);
	};

	const columns: StackColumn<BuildingLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			width: "4.5rem",
			render: (level) => <span className="font-mono font-semibold">{level.label}</span>,
		},
		{
			id: "cost",
			header: t("columns.cost"),
			width: "minmax(0,2.4fr)",
			render: (level) => (
				<ResourceList entries={costEntries(level)} emptyText={t("cells.none")} />
			),
		},
		{
			id: "time",
			header: t("columns.time"),
			width: "5rem",
			render: (level) => formatDuration(level.buildTimeSeconds),
		},
		{
			id: "power",
			header: t("columns.power"),
			width: "5.5rem",
			render: (level) => formatNumber(level.power),
		},
		{
			id: "requires",
			header: t("columns.requires"),
			width: "minmax(0,1.4fr)",
			render: (level) =>
				requirementText(level) ?? <span className="text-muted">{t("cells.none")}</span>,
		},
		...statIds.map((id) => ({
			id,
			header: t(`columns.stats.${id}`),
			width: "5.5rem",
			render: (level: BuildingLevel) => statCell(level, id),
		})),
	];

	const standardCount = levelsInRange(building, "standard").length;
	const fireCrystalCount = building.levels.length - standardCount;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={formatNumber(building.levels.length)}
					label={t("detail.levelsTotal")}
				/>
				<StatTile value={formatNumber(standardCount)} label={t("detail.standardLevels")} />
				<StatTile
					value={formatNumber(fireCrystalCount)}
					label={t("detail.fireCrystalLevels")}
				/>
				<StatTile value={building.maxLevelLabel} label={t("detail.maxLevel")} />
			</div>
			{hasRangeFilter && (
				<div className="max-w-xs">
					<Select
						aria-label={t("detail.rangeLabel")}
						value={range}
						onChange={(event) => setRange(event.target.value as LevelRangeId)}
					>
						{rangeOptions.map((option) => (
							<option key={option.id} value={option.id}>
								{t("detail.rangeOption", {
									range: t(`detail.ranges.${option.id}`),
									count: formatNumber(option.count),
								})}
							</option>
						))}
					</Select>
				</div>
			)}
			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">
					{t("detail.totalTitle", {
						range: t(`detail.ranges.${shownRange}`),
						count: rangeLevels.length,
						amount: formatNumber(rangeLevels.length),
					})}
				</h3>
				<ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{totalCostOf(rangeLevels).map((total) => {
						const item = total.itemId ? findItem(total.itemId) : undefined;
						return (
							<li
								key={total.itemId ?? total.name}
								className="border-line bg-bg flex items-center gap-3 rounded-md border-[1.5px] p-3"
							>
								<ItemIcon src={item?.img} size={32} />
								<span className="flex min-w-0 flex-col">
									<span className="font-mono text-lg">
										{formatNumber(total.amount)}
									</span>
									<span className="text-muted">
										{item?.name ?? total.name ?? total.itemId}
									</span>
								</span>
							</li>
						);
					})}
					<li className="border-line bg-bg flex flex-col justify-center rounded-md border-[1.5px] p-3">
						<span className="font-mono text-lg">
							{formatDuration(totalBuildSecondsOf(rangeLevels))}
						</span>
						<span className="text-muted">{t("detail.totalTime")}</span>
					</li>
				</ul>
			</Card>
			<StackTable
				label={t("detail.tableLabel", { name: building.name })}
				columns={columns}
				rows={rangeLevels}
				rowKey={(level) => level.id}
			/>
		</div>
	);
}
