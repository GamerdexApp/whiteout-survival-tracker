import { useTranslations } from "next-intl";
import { formatDecimal, formatDuration, formatNumber } from "@/lib/format";
import { changedTierRows, hasPromotion, runKindsOf, troopEventRows } from "@/service/calcTroop";
import type { RunKind, TroopCalculatorState, TroopEventRow } from "@/service/calcTroop";
import { TROOP_TYPES } from "@/data/game/calcTroop";
import type { TroopCalculation, TroopType } from "@/data/game/calcTroop";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";
import { useGameLabels } from "../../useGameLabels";
import { TierTable } from "./TierTable";

interface TroopResultsProps {
	state: TroopCalculatorState;
	calculation: TroopCalculation;
}

export function TroopResults({ state, calculation }: TroopResultsProps) {
	const t = useTranslations("calcTroop");
	const labels = useGameLabels();
	const changesTroops = changedTierRows(calculation.tiers).length > 0;
	const fireCrystalLevels = TROOP_TYPES.map((type) =>
		t("tiers.fireCrystalLevel", {
			name: labels.troopId(type),
			level: formatNumber(calculation.fireCrystalLevels[type]),
		})
	).join(", ");

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-lg font-semibold">{t("results.title")}</h2>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<StatTile
					label={t("results.capacity")}
					value={formatNumber(calculation.capacity)}
					emphasis
				/>
				<StatTile
					label={t("results.speedUsed")}
					value={t("results.percent", {
						value: formatDecimal(calculation.trainingSpeedPercent),
					})}
				/>
				<StatTile
					label={t("results.troops")}
					value={formatNumber(calculation.totals.total)}
				/>
				<StatTile
					label={t("results.power")}
					value={formatNumber(calculation.totalPower.total)}
				/>
				<StatTile
					label={t("results.totalTime")}
					value={formatDuration(calculation.totalSeconds)}
				/>
				<StatTile
					label={t("results.longest")}
					value={formatDuration(calculation.longestCampSeconds)}
				/>
			</div>
			{changesTroops ? (
				<>
					<TierTable
						title={t("tiers.troopsTitle")}
						rows={calculation.tiers}
						totals={calculation.totals}
					/>
					<TierTable
						title={t("tiers.powerTitle")}
						rows={calculation.tierPower}
						totals={calculation.totalPower}
					/>
					{hasPromotion(state) && (
						<p className="text-muted">{t("tiers.promotionNote")}</p>
					)}
					<p className="text-muted">
						{t("tiers.fireCrystalNote", { levels: fireCrystalLevels })}
					</p>
				</>
			) : (
				<Note>{t("results.noChange")}</Note>
			)}
			<ResourcesCard calculation={calculation} />
			<TimeTable state={state} calculation={calculation} />
			<EventTable calculation={calculation} />
		</section>
	);
}

function ResourcesCard({ calculation }: { calculation: TroopCalculation }) {
	const t = useTranslations("calcTroop.resources");

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("title")}</h3>
			<Card className="p-0">
				<table className="w-full border-collapse" aria-label={t("tableLabel")}>
					<thead className="sr-only">
						<tr>
							<th scope="col">{t("heads.resource")}</th>
							<th scope="col">{t("heads.amount")}</th>
						</tr>
					</thead>
					<tbody>
						{calculation.resources.map((resource) => {
							const item = findItem(resource.itemId);
							return (
								<tr
									key={resource.itemId}
									className="border-line border-t-[1.5px] first:border-t-0"
								>
									<th scope="row" className="px-3 py-2 text-start font-normal">
										<span className="flex items-center gap-2">
											<ItemIcon src={item?.img} size={24} />
											{item?.name ?? resource.itemId}
										</span>
									</th>
									<td className="px-3 py-2 text-end font-mono">
										{formatNumber(resource.amount)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>
		</section>
	);
}

interface TimeRow {
	key: string;
	type: TroopType;
	kind: RunKind;
	troopsPerBatch: number;
	batches: number;
	seconds: number;
}

const timeRowsOf = (state: TroopCalculatorState, calculation: TroopCalculation): TimeRow[] =>
	TROOP_TYPES.flatMap((type) =>
		runKindsOf(state.camps[type].mode).map((kind, index) => ({
			key: `${type}-${kind}`,
			type,
			kind,
			...calculation.camps[type].runs[index],
		}))
	);

function TimeTable({ state, calculation }: TroopResultsProps) {
	const t = useTranslations("calcTroop");
	const labels = useGameLabels();
	const tierText = (tier: number) => t("tier", { tier: formatNumber(tier) });
	const actionText = (row: TimeRow) => {
		const camp = state.camps[row.type];
		return row.kind === "training"
			? t("time.training", { tier: tierText(camp.training.tier) })
			: t("time.promotion", {
					from: tierText(camp.promotion.fromTier),
					to: tierText(camp.promotion.toTier),
				});
	};
	const columns: StackColumn<TimeRow>[] = [
		{
			id: "camp",
			header: t("time.heads.camp"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-medium">{labels.troopId(row.type)}</span>,
		},
		{
			id: "action",
			header: t("time.heads.action"),
			width: "minmax(0, 1.4fr)",
			render: actionText,
		},
		{
			id: "troopsPerBatch",
			header: t("time.heads.troopsPerBatch"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.troopsPerBatch)}</span>,
		},
		{
			id: "batches",
			header: t("time.heads.batches"),
			width: "minmax(0, 0.7fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.batches)}</span>,
		},
		{
			id: "time",
			header: t("time.heads.time"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-mono">{formatDuration(row.seconds)}</span>,
		},
	];

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("time.title")}</h3>
			<StackTable
				label={t("time.title")}
				columns={columns}
				rows={timeRowsOf(state, calculation)}
				rowKey={(row) => row.key}
			/>
			<Card className="flex flex-col p-0">
				{TROOP_TYPES.map((type) => (
					<TotalLine
						key={type}
						label={t("time.campTotal", { name: labels.troopId(type) })}
						value={formatDuration(calculation.camps[type].seconds)}
					/>
				))}
				<TotalLine
					label={t("time.totalTime")}
					value={formatDuration(calculation.totalSeconds)}
					strong
				/>
				<TotalLine
					label={t("time.longest")}
					value={formatDuration(calculation.longestCampSeconds)}
				/>
				<TotalLine
					label={t("time.minutesNeeded")}
					value={t("time.minutes", {
						value: formatNumber(calculation.speedupMinutesNeeded),
					})}
				/>
			</Card>
			<p className="text-muted">{t("time.note")}</p>
		</section>
	);
}

function TotalLine({
	label,
	value,
	strong = false,
}: {
	label: string;
	value: string;
	strong?: boolean;
}) {
	return (
		<div
			className={`border-line flex flex-wrap justify-between gap-x-3 gap-y-1 border-t-[1.5px] px-3 py-2 first:border-t-0 ${strong ? "font-semibold" : ""}`}
		>
			<span>{label}</span>
			<span className="font-mono">{value}</span>
		</div>
	);
}

function EventTable({ calculation }: { calculation: TroopCalculation }) {
	const t = useTranslations("calcTroop.events");
	const none = <span className="text-muted">{t("noSpeedup")}</span>;
	const columns: StackColumn<TroopEventRow>[] = [
		{
			id: "event",
			header: t("heads.event"),
			width: "minmax(0, 1.4fr)",
			render: (row) => <span className="font-medium">{row.name}</span>,
		},
		{
			id: "training",
			header: t("heads.training"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.trainingPoints)}</span>,
		},
		{
			id: "perMinute",
			header: t("heads.perMinute"),
			width: "minmax(0, 1fr)",
			render: (row) =>
				row.speedup ? (
					<span className="font-mono">{formatNumber(row.speedup.pointsPerMinute)}</span>
				) : (
					none
				),
		},
		{
			id: "speedup",
			header: t("heads.speedup"),
			width: "minmax(0, 1fr)",
			render: (row) =>
				row.speedup ? (
					<span className="font-mono">{formatNumber(row.speedup.points)}</span>
				) : (
					none
				),
		},
		{
			id: "total",
			header: t("heads.total"),
			width: "minmax(0, 1fr)",
			render: (row) => (
				<span className="font-mono font-semibold">{formatNumber(row.total)}</span>
			),
		},
	];

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("title")}</h3>
			<StackTable
				label={t("tableLabel")}
				columns={columns}
				rows={troopEventRows(calculation)}
				rowKey={(row) => row.key}
			/>
			<p className="text-muted">
				{t("note", { minutes: formatNumber(calculation.speedupMinutesNeeded) })}
			</p>
		</section>
	);
}
