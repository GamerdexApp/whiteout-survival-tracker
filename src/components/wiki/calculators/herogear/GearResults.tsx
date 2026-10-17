"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import { heroGearEventKeys, heroGearEventName } from "@/data/game/calcHeroGear";
import type { HeroGearPieceCalculation, HeroGearStatValues } from "@/data/game/calcHeroGear";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../../tables/ResourceList";
import { StackTable } from "../../tables/StackTable";

type Result = HeroGearPieceCalculation;

export function SummaryTiles({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear.summary");

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<StatTile emphasis value={formatNumber(result.power)} label={t("powerGained")} />
			<StatTile value={formatNumber(result.currentPower)} label={t("currentPower")} />
			<StatTile value={formatNumber(result.goalPower)} label={t("goalPower")} />
			<StatTile
				value={t("percent", {
					value: formatDecimal(result.masteryForging.statsUpPercent),
				})}
				label={t("forgingStatsUp")}
			/>
		</div>
	);
}

export function ResourcesCard({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear.resources");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			{result.resources.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2">
					{result.resources.map(({ itemId, amount }) => {
						const item = findItem(itemId);
						return (
							<li key={itemId} className="flex items-center gap-3">
								<ItemIcon src={item?.img} size={36} />
								<span className="flex min-w-0 flex-col">
									<span className="text-muted">{item?.name ?? itemId}</span>
									<span className="font-mono font-semibold">
										{formatNumber(amount)}
									</span>
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</Card>
	);
}

type StatKey = keyof HeroGearStatValues | "power";

export function PieceStatsCard({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear.stats");
	const { stats } = result;
	const rows: { id: StatKey; label: string; values: [number, number, number] }[] = [
		{
			id: "power",
			label: t("power"),
			values: [result.currentPower, result.goalPower, result.power],
		},
		...(["combatStat", "health", "percentStat"] as const).map((id) => ({
			id,
			label: {
				combatStat: stats.combatStatName,
				health: t("health"),
				percentStat: t("percentStat", { name: stats.percentStatName }),
			}[id],
			values: [stats.current[id], stats.goal[id], stats.gain[id]] as [number, number, number],
		})),
	];
	const formatValue = (id: StatKey, value: number) =>
		id === "percentStat"
			? t("percentValue", { value: formatDecimal(value) })
			: formatNumber(value);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<ScrollRegion label={t("tableLabel")} className="relative overflow-x-auto">
				<table className="w-full min-w-80 text-start">
					<thead>
						<tr>
							{(["stat", "current", "goal", "gain"] as const).map((id) => (
								<th
									key={id}
									scope="col"
									className={`py-1 ${id === "stat" ? "pe-3 text-start" : "ps-3 text-end"}`}
								>
									<SectionLabel className="text-muted">{t(id)}</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id} className="border-line border-t-[1.5px]">
								<th scope="row" className="py-2 pe-3 text-start font-medium">
									{row.label}
								</th>
								{row.values.map((value, index) => (
									<td
										key={index}
										className={`py-2 ps-3 text-end font-mono whitespace-nowrap ${
											index === 2 ? "font-semibold" : ""
										}`}
									>
										{formatValue(row.id, value)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
			<p className="text-muted text-xs">{t("note")}</p>
		</Card>
	);
}

export function MilestonesCard({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear.milestones");
	const { milestones } = result.stats;

	return (
		<Card className="flex flex-col gap-2 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			{milestones.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<ul className="flex flex-col gap-1">
					{milestones.map((milestone) => (
						<li key={milestone.empowermentLevel}>
							{t("line", {
								level: formatNumber(milestone.empowermentLevel),
								event: milestone.event,
								stat: milestone.stat,
							})}
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}

interface TrackRow {
	id: "enhancement" | "masteryForging" | "empowerment";
	steps: number;
	gain: string;
	resources: Result["resources"];
}

export function TracksTable({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear");
	const powerGain = (power: number) => t("tracksTable.powerGain", { value: formatNumber(power) });
	const rows: TrackRow[] = [
		{
			id: "enhancement",
			steps: result.enhancement.steps,
			gain: powerGain(result.enhancement.power),
			resources: result.enhancement.resources,
		},
		{
			id: "masteryForging",
			steps: result.masteryForging.steps,
			gain: t("tracksTable.statsUp", {
				value: formatDecimal(result.masteryForging.statsUpPercent),
			}),
			resources: result.masteryForging.resources,
		},
		{
			id: "empowerment",
			steps: result.empowerment.steps,
			gain: powerGain(result.empowerment.power),
			resources: result.empowerment.resources,
		},
	];

	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-semibold">{t("tracksTable.title")}</h2>
			<StackTable
				label={t("tracksTable.label")}
				rows={rows}
				rowKey={(row) => row.id}
				columns={[
					{
						id: "track",
						header: t("tracksTable.track"),
						width: "minmax(9rem, 1fr)",
						render: (row) => (
							<span className="font-medium">{t(`tracks.${row.id}`)}</span>
						),
					},
					{
						id: "steps",
						header: t("tracksTable.steps"),
						width: "5rem",
						render: (row) => (
							<span className="font-mono">{formatNumber(row.steps)}</span>
						),
					},
					{
						id: "gain",
						header: t("tracksTable.gain"),
						width: "minmax(10rem, 1fr)",
						render: (row) => <span className="font-mono">{row.gain}</span>,
					},
					{
						id: "resources",
						header: t("tracksTable.resources"),
						width: "minmax(12rem, 2fr)",
						render: (row) => (
							<ResourceList
								exact
								entries={row.resources}
								emptyText={t("tracksTable.none")}
							/>
						),
					},
				]}
			/>
		</section>
	);
}

export function EventPointsCard({ result }: { result: Result }) {
	const t = useTranslations("calcHeroGear.events");

	return (
		<section className="flex flex-col gap-3">
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="grid gap-3 sm:grid-cols-3">
				{heroGearEventKeys.map((key) => (
					<StatTile
						key={key}
						value={formatNumber(result.eventPoints[key])}
						label={heroGearEventName(key)}
					/>
				))}
			</div>
			<p className="text-muted text-xs">{t("note")}</p>
		</section>
	);
}
