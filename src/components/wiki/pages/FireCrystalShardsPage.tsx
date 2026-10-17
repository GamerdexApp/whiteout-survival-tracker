"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { buildShardTable, SHARD_TIER_IDS } from "@/data/game/fireCrystalTables";
import type { ShardTierId } from "@/data/game/fireCrystalTables";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { MatrixTable } from "../tables/MatrixTable";
import type { MatrixGroup, MatrixRow } from "../tables/MatrixTable";
import { WikiPageShell } from "../WikiPageShell";

const RESEARCH_TIER_PREFIX = "tier-";

export function FireCrystalShardsPage() {
	const t = useTranslations("wikiFireCrystal");
	const [tier, setTier] = useState<ShardTierId>("all");
	const table = buildShardTable(tier);

	const rowLabel = (row: (typeof table.rows)[number]) =>
		row.kind === "extras"
			? t("shards.rows.tier", { tier: row.id.slice(RESEARCH_TIER_PREFIX.length) })
			: t(`shards.rows.${row.kind}`);

	const groups = table.columns.reduce<MatrixGroup[]>((found, column) => {
		const subColumn = {
			id: `${column.tier}-${column.resource}`,
			header: (
				<span className="inline-flex items-center justify-center gap-1">
					<ItemIcon src={column.item.img} size={24} />
					<span>{column.tier}</span>
					<span className="sr-only">{column.item.name}</span>
				</span>
			),
		};
		const last = found[found.length - 1];
		if (last?.id === column.troopType) {
			last.columns.push(subColumn);
			return found;
		}
		return [...found, { id: column.troopType, title: column.troopType, columns: [subColumn] }];
	}, []);

	const rows: MatrixRow[] = table.rows.map((row) => ({
		id: row.id,
		label: rowLabel(row),
		cells: row.cells,
		emphasis:
			row.kind === "total" ? "total" : row.kind === "extrasTotal" ? "subtotal" : undefined,
	}));

	return (
		<WikiPageShell id="fireCrystalShards" line={t("shards.line")}>
			<Card className="flex flex-col gap-4 p-4">
				<p className="text-muted">{t("shards.description")}</p>
				<div className="max-w-xs">
					<Select
						aria-label={t("shards.tierLabel")}
						value={tier}
						onChange={(event) => setTier(event.target.value as ShardTierId)}
					>
						{SHARD_TIER_IDS.map((id) => (
							<option key={id} value={id}>
								{t(`shards.tiers.${id}`)}
							</option>
						))}
					</Select>
				</div>
				<MatrixTable
					label={t("shards.tableLabel")}
					rowHeader={t("tables.research")}
					groups={groups}
					rows={rows}
				/>
			</Card>
		</WikiPageShell>
	);
}
