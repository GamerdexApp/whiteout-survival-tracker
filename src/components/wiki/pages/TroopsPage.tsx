"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDuration, formatNumber } from "@/lib/format";
import { allTroops, MAX_TIER } from "@/data/game/troops";
import type { TroopData, TroopTier } from "@/data/game/troops";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { ResourceList } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { WikiPageShell } from "../WikiPageShell";

type TroopId = TroopData["id"];

export function TroopsPage() {
	const t = useTranslations("wikiTroops");
	const [troopId, setTroopId] = useState<TroopId>(allTroops[0].id);
	const troop = allTroops.find((entry) => entry.id === troopId) ?? allTroops[0];

	const costCell = (tier: TroopTier) => (
		<>
			<ResourceList exact entries={tier.cost} emptyText={t("cells.none")} />
		</>
	);
	const promotionCell = (tier: TroopTier) =>
		tier.promotionCost ? (
			<ResourceList exact entries={tier.promotionCost} emptyText={t("cells.none")} />
		) : (
			<span className="text-muted">{t("cells.none")}</span>
		);

	const tierColumns: StackColumn<TroopTier>[] = [
		{
			id: "tier",
			header: t("columns.tier"),
			width: "5rem",
			render: (tier) => (
				<span className="font-mono font-semibold">
					{t("cells.tier", { tier: formatNumber(tier.tier) })}
				</span>
			),
		},
		{ id: "cost", header: t("columns.cost"), width: "minmax(0,2fr)", render: costCell },
		{
			id: "time",
			header: t("columns.time"),
			width: "7rem",
			render: (tier) => formatDuration(tier.trainingTimeSeconds),
		},
		{
			id: "promotion",
			header: t("columns.promotion"),
			width: "minmax(0,2fr)",
			render: promotionCell,
		},
	];

	const topTierOf = (entry: TroopData) => entry.tiers[entry.tiers.length - 1];
	const typeColumns: StackColumn<TroopData>[] = [
		{
			id: "type",
			header: t("columns.type"),
			width: "6rem",
			render: (entry) => <span className="font-semibold">{entry.name}</span>,
		},
		{
			id: "cost",
			header: t("columns.topCost"),
			width: "minmax(0,2fr)",
			render: (entry) => costCell(topTierOf(entry)),
		},
		{
			id: "time",
			header: t("columns.time"),
			width: "7rem",
			render: (entry) => formatDuration(topTierOf(entry).trainingTimeSeconds),
		},
		{
			id: "promotion",
			header: t("columns.promotion"),
			width: "minmax(0,2fr)",
			render: (entry) => promotionCell(topTierOf(entry)),
		},
	];

	return (
		<WikiPageShell
			id="troops"
			line={t("line", {
				types: formatNumber(allTroops.length),
				tiers: formatNumber(troop.tiers.length),
			})}
		>
			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("tiers.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("tiers.meta", {
							types: formatNumber(allTroops.length),
							tiers: formatNumber(troop.tiers.length),
							rows: formatNumber(allTroops.length * troop.tiers.length),
						})}
					</span>
				</h2>
				<div>
					<SegmentedControl
						label={t("tiers.typeLabel")}
						options={allTroops.map((entry) => ({ id: entry.id, label: entry.name }))}
						value={troopId}
						onChange={setTroopId}
					/>
				</div>
				<StackTable
					label={t("tiers.tableLabel", { type: troop.name })}
					columns={tierColumns}
					rows={troop.tiers}
					rowKey={(tier) => String(tier.tier)}
					selectedKey={String(MAX_TIER)}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("detail.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("detail.meta", { tier: formatNumber(MAX_TIER) })}
					</span>
				</h2>
				<StackTable
					label={t("detail.tableLabel", { tier: formatNumber(MAX_TIER) })}
					columns={typeColumns}
					rows={allTroops}
					rowKey={(entry) => entry.id}
				/>
			</section>
		</WikiPageShell>
	);
}
