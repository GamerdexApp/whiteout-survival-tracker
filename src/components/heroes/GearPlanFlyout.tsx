"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { HeroGearPiece, HeroGearSlot, Playthrough } from "@/types/app";
import { formatDateTime, formatDecimal, formatNumber } from "@/lib/format";
import type { GearPlanResult, PlanGoals, PlanPieceRef } from "@/service/heroGear";
import {
	empowermentLock,
	forgingLimitIndex,
	gearPlanChecks,
	gearSetsOf,
	initialPlanGoals,
	initialPlanRefs,
	isMythic,
	lockText,
	normalizedGoal,
	qualityOf,
	runGearPlan,
	slotIds,
	slotName,
	troopLabel,
} from "@/service/heroGear";
import { exportSpecOf } from "@/service/heroGearExport";
import { forgingIndex, forgingRows, MAX_EMPOWERMENT, MAX_ENHANCEMENT } from "@/data/game/heroGear";
import { findItem } from "@/data/game/items";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { ValueStepper } from "@/comps/ui/ValueStepper";

interface GearPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (refs: PlanPieceRef[], goals: PlanGoals) => void;
}

const sameRef = (a: PlanPieceRef, b: PlanPieceRef) => a.setId === b.setId && a.slot === b.slot;

export function GearPlanFlyout({ open, chief, onClose, onSave }: GearPlanFlyoutProps) {
	const [wasOpen, setWasOpen] = useState(false);
	const [refs, setRefs] = useState<PlanPieceRef[]>([]);
	const [goals, setGoals] = useState<PlanGoals>({});
	const [exportOpen, setExportOpen] = useState(false);
	const exportSpec = useMemo(
		() => exportSpecOf(runGearPlan(chief, refs, goals)),
		[chief, refs, goals]
	);
	const nothingToExport = exportSpec.groups.length === 0;

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setRefs(initialPlanRefs(chief));
			setGoals(initialPlanGoals(chief));
		}
	}

	const t = useTranslations("heroGear.plan");
	const te = useTranslations("heroGear.export");
	const savedAt = chief.heroGearPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted me-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							{t("saved", { time: formatDateTime(savedAt) })}
						</span>
					)}
					<Button onClick={onClose}>{t("close")}</Button>
					<Button
						disabled={nothingToExport}
						title={nothingToExport ? te("nothing") : undefined}
						onClick={() => setExportOpen(true)}
					>
						{te("button")}
					</Button>
					<Button variant="primary" onClick={() => onSave(refs, goals)}>
						{t("save")}
					</Button>
				</>
			}
		>
			<PlanBody
				chief={chief}
				refs={refs}
				goals={goals}
				onRefsChange={setRefs}
				onGoalsChange={setGoals}
			/>
			<ExportToEventFlyout
				open={exportOpen}
				chief={chief}
				spec={exportSpec}
				onClose={() => setExportOpen(false)}
			/>
		</Flyout>
	);
}

function PlanBody({
	chief,
	refs,
	goals,
	onRefsChange,
	onGoalsChange,
}: {
	chief: Playthrough;
	refs: PlanPieceRef[];
	goals: PlanGoals;
	onRefsChange: (refs: PlanPieceRef[]) => void;
	onGoalsChange: (goals: PlanGoals) => void;
}) {
	const t = useTranslations("heroGear.plan");
	const plan = useMemo(() => runGearPlan(chief, refs, goals), [chief, refs, goals]);

	return (
		<>
			<AddPiece chief={chief} refs={refs} onAdd={(ref) => onRefsChange([...refs, ref])} />
			{plan.rows.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("empty")}</p>
				</Card>
			) : (
				plan.rows.map((row) => (
					<PieceBlock
						key={`${row.ref.setId}/${row.ref.slot}`}
						row={row}
						onGoalChange={(goal) =>
							onGoalsChange({
								...goals,
								[row.ref.setId]: { ...goals[row.ref.setId], [row.ref.slot]: goal },
							})
						}
						onRemove={() => onRefsChange(refs.filter((ref) => !sameRef(ref, row.ref)))}
					/>
				))
			)}
			{plan.rows.length > 0 && (
				<>
					<PlanStockCheck checks={gearPlanChecks(plan, chief)} timeNote="" />
					<PlanResult plan={plan} />
				</>
			)}
		</>
	);
}

function AddPiece({
	chief,
	refs,
	onAdd,
}: {
	chief: Playthrough;
	refs: PlanPieceRef[];
	onAdd: (ref: PlanPieceRef) => void;
}) {
	const t = useTranslations("heroGear.plan");
	const sets = gearSetsOf(chief);
	const [setId, setSetId] = useState("");
	const [slot, setSlot] = useState<HeroGearSlot>("goggles");
	const selectedSetId = sets.some((set) => set.id === setId) ? setId : (sets[0]?.id ?? "");
	const taken = refs.some((ref) => ref.setId === selectedSetId && ref.slot === slot);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("addPiece.title")}</h3>
			{sets.length === 0 ? (
				<p className="text-muted">{t("addPiece.noSets")}</p>
			) : (
				<>
					<div className="flex flex-wrap gap-3">
						<div className="min-w-40 flex-1">
							<Select
								aria-label={t("addPiece.set")}
								value={selectedSetId}
								onChange={(event) => setSetId(event.target.value)}
							>
								{sets.map((set) => (
									<option key={set.id} value={set.id}>
										{t("addPiece.setOption", {
											name: set.name,
											troop: troopLabel(set.troopType),
										})}
									</option>
								))}
							</Select>
						</div>
						<div className="min-w-32 flex-1">
							<Select
								aria-label={t("addPiece.piece")}
								value={slot}
								onChange={(event) => setSlot(event.target.value as HeroGearSlot)}
							>
								{slotIds.map((id) => (
									<option key={id} value={id}>
										{slotName(id)}
									</option>
								))}
							</Select>
						</div>
						<Button
							variant="primary"
							disabled={taken}
							onClick={() => onAdd({ setId: selectedSetId, slot })}
						>
							<LuPlus size={16} aria-hidden="true" />
							{t("addPiece.submit")}
						</Button>
					</div>
					{taken && <p className="text-muted text-xs">{t("addPiece.taken")}</p>}
				</>
			)}
		</Card>
	);
}

function PieceBlock({
	row,
	onGoalChange,
	onRemove,
}: {
	row: PlanResultRow;
	onGoalChange: (goal: HeroGearPiece) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("heroGear.plan");
	const { set, piece, goal, ref } = row;
	const title = t("pieceTitle", { set: set.name, slot: slotName(ref.slot) });
	const rowLabel = (id: string | null) => {
		const forgingRow = forgingRows.find((item) => item.id === id);
		return forgingRow
			? t("forgingRow", {
					name: forgingRow.name,
					percent: formatDecimal(forgingRow.statsUpPercent),
				})
			: t("none");
	};
	const change = (patch: Partial<HeroGearPiece>) =>
		onGoalChange(normalizedGoal(piece, { ...goal, ...patch }));
	const limit = forgingLimitIndex(goal.enhancement);
	const lock = empowermentLock(goal);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h3 className="font-semibold">{title}</h3>
					<span className="flex gap-1.5">
						<Badge tone="added">{troopLabel(set.troopType)}</Badge>
						{!isMythic(piece) && (
							<Badge tone="locked">{t(`qualities.${qualityOf(piece)}`)}</Badge>
						)}
					</span>
				</div>
				<IconButton
					label={t("remove", { title })}
					onClick={onRemove}
					className="text-danger hover:bg-tint"
				>
					<LuTrash2 size={18} aria-hidden="true" />
				</IconButton>
			</div>
			{isMythic(piece) && (
				<>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="flex flex-col gap-1">
							<SectionLabel className="text-muted">
								{t("forgingCurrent")}
							</SectionLabel>
							<p className="font-mono text-xs">{rowLabel(piece.forging)}</p>
						</div>
						<div className="flex flex-col gap-1">
							<SectionLabel className="text-muted">{t("forgingGoal")}</SectionLabel>
							<Select
								aria-label={t("forgingGoalLabel", { title })}
								value={goal.forging ?? ""}
								onChange={(event) =>
									change({ forging: event.target.value || null })
								}
							>
								<option value="" disabled={piece.forging !== null}>
									{t("none")}
								</option>
								{forgingRows.map((item, index) => (
									<option
										key={item.id}
										value={item.id}
										disabled={
											index > limit || index < forgingIndex(piece.forging)
										}
									>
										{rowLabel(item.id)}
									</option>
								))}
							</Select>
						</div>
					</div>
					{goal.enhancement < MAX_ENHANCEMENT && (
						<p className="text-muted text-xs">{t("forgingStops")}</p>
					)}
				</>
			)}
			<div className="flex items-center justify-between gap-3">
				<span>{t("enhancement")}</span>
				<span className="flex items-center gap-2">
					<span className="text-muted font-mono text-xs">
						{t("from", { value: formatNumber(piece.enhancement) })}
					</span>
					<ValueStepper
						label={t("enhancementGoal", { title })}
						value={goal.enhancement}
						min={piece.enhancement}
						max={MAX_ENHANCEMENT}
						onChange={(enhancement) => change({ enhancement })}
					/>
				</span>
			</div>
			{lock ? (
				<div className="border-line flex flex-wrap items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed p-2">
					<span>{t("empowerment")}</span>
					<span className="text-muted font-mono text-xs">{lockText(lock)}</span>
				</div>
			) : (
				<div className="flex items-center justify-between gap-3">
					<span>{t("empowerment")}</span>
					<span className="flex items-center gap-2">
						<span className="text-muted font-mono text-xs">
							{t("from", { value: formatNumber(piece.empowerment) })}
						</span>
						<ValueStepper
							label={t("empowermentGoal", { title })}
							value={goal.empowerment}
							min={piece.empowerment}
							max={MAX_EMPOWERMENT}
							onChange={(empowerment) => change({ empowerment })}
						/>
					</span>
				</div>
			)}
		</Card>
	);
}

type PlanResultRow = GearPlanResult["rows"][number];

const powerLineIds = ["gained", "before", "after"] as const;
const eventIds = ["svs", "allianceShowdown", "kingOfIcefield"] as const;
const resultColumnIds = ["piece", "forgingStatsUp", "powerGained"] as const;

function PlanResult({ plan }: { plan: GearPlanResult }) {
	const t = useTranslations("heroGear.plan");
	const powerByLine = {
		gained: plan.power,
		before: plan.currentPower,
		after: plan.goalPower,
	};
	const pointsByEvent = {
		svs: plan.eventPoints.svs,
		allianceShowdown: plan.eventPoints.allianceShowdown,
		kingOfIcefield: plan.eventPoints.kingOfIcefield,
	};

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">
				{t("result.title", {
					count: plan.rows.length,
					amount: formatNumber(plan.rows.length),
				})}
			</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[...plan.resources.entries()].map(([itemId, amount]) => {
					const item = findItem(itemId);
					return (
						<div key={itemId} className="flex items-start gap-2">
							<ItemIcon src={item?.img} size={24} />
							<div className="flex flex-col">
								<span className="text-muted text-xs">{item?.name ?? itemId}</span>
								<span className="font-mono font-semibold">
									{formatNumber(amount)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<div className="flex flex-col">
				<SectionLabel className="text-muted pb-1">{t("result.power")}</SectionLabel>
				{powerLineIds.map((id) => (
					<div
						key={id}
						className="border-line flex justify-between border-t-[1.5px] py-1.5 first:border-t-0"
					>
						<span>{t(`result.powerLines.${id}`)}</span>
						<span className="font-mono font-medium">
							{formatNumber(powerByLine[id])}
						</span>
					</div>
				))}
			</div>
			<ScrollRegion label={t("result.tableLabel")}>
				<table className="w-full min-w-104 text-start">
					<thead>
						<tr>
							{resultColumnIds.map((id) => (
								<th key={id} className="py-1 pe-3">
									<SectionLabel className="text-muted">
										{t(`result.columns.${id}`)}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{plan.rows.map((row) => (
							<tr
								key={`${row.ref.setId}/${row.ref.slot}`}
								className="border-line border-t-[1.5px]"
							>
								<td className="py-1.5 pe-3 font-medium">
									{t("pieceTitle", {
										set: row.set.name,
										slot: slotName(row.ref.slot),
									})}
								</td>
								<td className="pe-3 font-mono">
									{t("result.forgingStatsUp", {
										percent: formatDecimal(
											row.calculation.masteryForging.statsUpPercent
										),
										steps: formatNumber(row.calculation.masteryForging.steps),
									})}
								</td>
								<td className="font-mono">{formatNumber(row.calculation.power)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
			{plan.milestones.length > 0 && (
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("result.milestones")}</SectionLabel>
					{plan.milestones.map((item) => (
						<p key={`${item.label}${item.stat}`}>
							{t("result.milestoneLine", { label: item.label, stat: item.stat })}
						</p>
					))}
				</div>
			)}
			<div className="grid grid-cols-3 gap-3">
				{eventIds.map((id) => (
					<div
						key={id}
						className="border-line flex flex-col rounded-md border-[1.5px] p-2"
					>
						<span className="text-muted text-xs">{t(`result.events.${id}`)}</span>
						<span className="font-mono font-semibold">
							{formatNumber(pointsByEvent[id])}
						</span>
					</div>
				))}
			</div>
			<p className="text-muted text-xs">{t("result.note")}</p>
		</Card>
	);
}
