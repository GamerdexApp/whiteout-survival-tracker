"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { buildFireCrystalTable, FIRE_CRYSTAL_RANGE_IDS } from "@/data/game/fireCrystalTables";
import type { FireCrystalRangeId } from "@/data/game/fireCrystalTables";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { MatrixTable } from "../tables/MatrixTable";
import type { MatrixGroup, MatrixRow } from "../tables/MatrixTable";
import { WikiPageShell } from "../WikiPageShell";

export function FireCrystalPage() {
	const t = useTranslations("wikiFireCrystal");
	const [range, setRange] = useState<FireCrystalRangeId>("all");
	const table = buildFireCrystalTable(range);

	const groups = table.columns.reduce<MatrixGroup[]>((found, column) => {
		const resourceColumn = {
			id: column.resource,
			header: (
				<span className="inline-flex items-center justify-center">
					<ItemIcon src={column.item.img} size={24} />
					<span className="sr-only">{column.item.name}</span>
				</span>
			),
		};
		const last = found[found.length - 1];
		if (last?.id === column.level.id) {
			last.columns.push(resourceColumn);
			return found;
		}
		const title = (
			<span className="flex flex-col items-center gap-1">
				<ItemIcon src={column.level.img} size={36} />
				<span>{column.level.name}</span>
			</span>
		);
		return [...found, { id: column.level.id, title, columns: [resourceColumn] }];
	}, []);

	const rows: MatrixRow[] = [
		...table.rows.map((row) => ({
			id: row.buildingId,
			label: (
				<span className="flex items-center gap-2">
					<ItemIcon src={row.img} size={28} />
					{row.name}
				</span>
			),
			cells: row.cells,
		})),
		{
			id: "total",
			label: t("tables.total"),
			cells: table.totals,
			emphasis: "total" as const,
		},
	];

	return (
		<WikiPageShell id="fireCrystal" line={t("fireCrystal.line")}>
			<Card className="flex flex-col gap-4 p-4">
				<p className="text-muted">{t("fireCrystal.description")}</p>
				<div className="max-w-xs">
					<Select
						aria-label={t("fireCrystal.rangeLabel")}
						value={range}
						onChange={(event) => setRange(event.target.value as FireCrystalRangeId)}
					>
						{FIRE_CRYSTAL_RANGE_IDS.map((id) => (
							<option key={id} value={id}>
								{t(`fireCrystal.ranges.${id}`)}
							</option>
						))}
					</Select>
				</div>
				<MatrixTable
					label={t("fireCrystal.tableLabel")}
					rowHeader={t("tables.building")}
					groups={groups}
					rows={rows}
				/>
			</Card>
		</WikiPageShell>
	);
}
