"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { hasPlannedHunts, plannedHuntRows } from "@/service/calcBeast";
import type { BeastCalculatorInputs, PlannedHuntRow } from "@/service/calcBeast";
import type { BeastCalculation, BeastEventPoints } from "@/data/game/calcBeast";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";
import { useBeastLevelBandName } from "./BeastLevelSelect";

interface BeastResultsProps {
	inputs: BeastCalculatorInputs;
	result: BeastCalculation;
}

export function BeastResults({ inputs, result }: BeastResultsProps) {
	const t = useTranslations("calcBeast.result");

	return (
		<section className="flex flex-col gap-6">
			<StaminaTiles result={result} />
			<LeftoverHunts inputs={inputs} result={result} />
			<EventPoints result={result} />
			{hasPlannedHunts(inputs) && <PlannedHuntPoints inputs={inputs} result={result} />}
			<p className="text-muted text-xs">{t("pointsNote")}</p>
		</section>
	);
}

function StaminaTiles({ result }: { result: BeastCalculation }) {
	const t = useTranslations("calcBeast.result.tiles");
	const isShort = result.planned.staminaShort > 0;
	const tiles = [
		{ id: "total", value: formatNumber(result.totalStamina) },
		{
			id: "ginaReduction",
			value: t("percent", { percent: formatNumber(result.ginaReductionPercent) }),
		},
		{ id: "beastCost", value: formatNumber(result.beastStaminaCost) },
		{ id: "polarTerrorCost", value: formatNumber(result.polarTerrorStaminaCost) },
		{ id: "planned", value: formatNumber(result.planned.staminaNeeded) },
		isShort
			? ({ id: "short", value: formatNumber(result.planned.staminaShort) } as const)
			: ({ id: "left", value: formatNumber(result.planned.staminaLeft) } as const),
	] as const;

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{tiles.map((tile) => (
					<StatTile
						key={tile.id}
						label={t(tile.id)}
						value={<span className="break-all">{tile.value}</span>}
						emphasis={tile.id === "left"}
					/>
				))}
			</div>
			{isShort && (
				<Note tone="warning">
					{t("shortNote", { amount: formatNumber(result.planned.staminaShort) })}
				</Note>
			)}
		</div>
	);
}

interface LeftoverRow {
	id: "beasts" | "polarTerrors";
	count: number;
	staminaLeft: number;
}

function LeftoverHunts({ inputs, result }: BeastResultsProps) {
	const t = useTranslations("calcBeast.result.leftover");
	const bandName = useBeastLevelBandName();
	const rows: LeftoverRow[] = [
		{ id: "beasts", ...result.beasts },
		{ id: "polarTerrors", ...result.polarTerrors },
	];
	const columns: StackColumn<LeftoverRow>[] = [
		{
			id: "hunt",
			header: t("hunt"),
			width: "minmax(0,2fr)",
			render: (row) =>
				row.id === "beasts" ? (
					<span className="font-medium">
						{t("onlyBeasts", { band: bandName(inputs.beastLevel) })}
					</span>
				) : (
					<span className="font-medium">{t("onlyPolarTerrors")}</span>
				),
		},
		{
			id: "count",
			header: t("count"),
			width: "minmax(0,1fr)",
			render: (row) => <span className="font-mono break-all">{formatNumber(row.count)}</span>,
		},
		{
			id: "staminaLeft",
			header: t("staminaLeft"),
			width: "minmax(0,1fr)",
			render: (row) => (
				<span className="font-mono break-all">{formatNumber(row.staminaLeft)}</span>
			),
		},
	];

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title")}</h2>
				<p className="text-muted">{t("hint")}</p>
			</div>
			<StackTable label={t("title")} columns={columns} rows={rows} rowKey={(row) => row.id} />
		</div>
	);
}

function EventPoints({ result }: { result: BeastCalculation }) {
	const t = useTranslations("calcBeast.result.events");
	const points = (value: number) => (
		<span className="font-mono break-all">{formatNumber(value)}</span>
	);
	const columns: StackColumn<BeastEventPoints>[] = [
		{
			id: "event",
			header: t("event"),
			width: "minmax(0,1.4fr)",
			render: (event) => <span className="font-medium">{event.name}</span>,
		},
		{
			id: "perBeast",
			header: t("perBeast"),
			width: "minmax(0,0.8fr)",
			render: (event) => points(event.pointsPerBeast),
		},
		{
			id: "perPolarTerror",
			header: t("perPolarTerror"),
			width: "minmax(0,0.8fr)",
			render: (event) => points(event.pointsPerPolarTerror),
		},
		{
			id: "planned",
			header: t("planned"),
			width: "minmax(0,1.2fr)",
			render: (event) => points(event.plannedPoints),
		},
		{
			id: "withBeasts",
			header: t("withBeasts"),
			width: "minmax(0,1.2fr)",
			render: (event) => points(event.beastPoints),
		},
		{
			id: "withPolarTerrors",
			header: t("withPolarTerrors"),
			width: "minmax(0,1.2fr)",
			render: (event) => points(event.polarTerrorPoints),
		},
	];

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title")}</h2>
				<p className="text-muted">{t("hint")}</p>
			</div>
			<StackTable
				label={t("title")}
				columns={columns}
				rows={result.events}
				rowKey={(event) => event.eventId}
			/>
		</div>
	);
}

function PlannedHuntPoints({ inputs, result }: BeastResultsProps) {
	const t = useTranslations("calcBeast.result.plannedPoints");
	const bandName = useBeastLevelBandName();
	const huntName = (row: PlannedHuntRow) => {
		if (row.kind === "run") {
			return t("beasts", {
				count: row.count,
				amount: formatNumber(row.count),
				band: bandName(row.level),
			});
		}
		if (row.kind === "polarTerrors") {
			return t("polarTerrors", { count: row.count, amount: formatNumber(row.count) });
		}
		return t("total");
	};
	const columns: StackColumn<PlannedHuntRow>[] = [
		{
			id: "hunt",
			header: t("hunt"),
			width: "minmax(0,2fr)",
			render: (row) => (
				<span className={row.kind === "total" ? "font-semibold" : "font-medium"}>
					{huntName(row)}
				</span>
			),
		},
		...result.events.map((event, eventIndex) => ({
			id: event.eventId,
			header: event.name,
			width: "minmax(0,1fr)",
			render: (row: PlannedHuntRow) => (
				<span
					className={`font-mono break-all ${row.kind === "total" ? "font-semibold" : ""}`}
				>
					{formatNumber(row.points[eventIndex])}
				</span>
			),
		})),
	];

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-semibold">{t("title")}</h2>
			<StackTable
				label={t("title")}
				columns={columns}
				rows={plannedHuntRows(inputs, result)}
				rowKey={(row) => row.id}
			/>
		</div>
	);
}
