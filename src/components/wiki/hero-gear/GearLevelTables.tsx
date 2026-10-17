"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import { forgingRows } from "@/data/game/heroGear";
import { empowermentRows, enhancementRows } from "@/data/game/wikiHeroGear";
import { RecordItems } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";

type LevelKind = "enhancement" | "empowerment" | "mastery";
type GearRow =
	| (typeof enhancementRows)[number]
	| (typeof empowermentRows)[number]
	| (typeof forgingRows)[number];

const rowsByKind: Record<LevelKind, GearRow[]> = {
	enhancement: enhancementRows,
	empowerment: empowermentRows,
	mastery: forgingRows,
};

const powerOf = (row: GearRow) => ("power" in row ? row.power : undefined);

export function GearLevelTables({ kind }: { kind: LevelKind }) {
	const t = useTranslations("wikiHeroGear");
	const rows = rowsByKind[kind];

	const gainCell = (row: GearRow) => {
		const power = powerOf(row);
		const previous = rows[rows.indexOf(row) - 1];
		const previousPower = previous ? powerOf(previous) : undefined;
		if (power === undefined || previousPower === undefined) return <UnknownValue />;

		return (
			<span className="font-mono">
				{t("levels.gainValue", { value: formatNumber(power - previousPower) })}
			</span>
		);
	};

	const levelColumn: RecordColumn<GearRow> = {
		id: "level",
		header: t("levels.columns.level"),
		heading: true,
		cell: (row) => <span className="font-semibold">{row.name}</span>,
	};
	const costColumn: RecordColumn<GearRow> = {
		id: "cost",
		header: t("levels.columns.cost"),
		cell: (row) => <RecordItems items={row.cost} />,
	};
	const powerColumn: RecordColumn<GearRow> = {
		id: "power",
		header: t("levels.columns.power"),
		cell: (row) => <span className="font-mono">{formatNumber(powerOf(row) ?? 0)}</span>,
	};
	const gainColumn: RecordColumn<GearRow> = {
		id: "gain",
		header: t("levels.columns.gain"),
		cell: gainCell,
	};

	const columnsByKind: Record<LevelKind, RecordColumn<GearRow>[]> = {
		enhancement: [levelColumn, costColumn, powerColumn, gainColumn],
		empowerment: [
			levelColumn,
			costColumn,
			powerColumn,
			{
				id: "milestonePower",
				header: t("levels.columns.milestonePower"),
				cell: (row) =>
					"milestonePower" in row && row.milestonePower ? (
						<span className="font-mono">{formatNumber(row.milestonePower)}</span>
					) : (
						t("levels.none")
					),
			},
			gainColumn,
		],
		mastery: [
			levelColumn,
			{
				id: "stage",
				header: t("levels.columns.stage"),
				cell: (row) => ("stage" in row ? formatNumber(row.stage) : null),
			},
			costColumn,
			{
				id: "statsUp",
				header: t("levels.columns.statsUp"),
				cell: (row) =>
					"statsUpPercent" in row
						? t("levels.percent", { value: formatDecimal(row.statsUpPercent) })
						: null,
			},
		],
	};

	return <RecordTable columns={columnsByKind[kind]} rows={rows} rowKey={(row) => row.id} />;
}
