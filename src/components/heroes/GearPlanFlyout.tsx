"use client";

import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { HeroGearPiece, HeroGearSlot, Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
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
import { forgingIndex, forgingRows, MAX_EMPOWERMENT, MAX_ENHANCEMENT } from "@/data/game/heroGear";
import { findItem } from "@/data/game/items";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
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

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setRefs(initialPlanRefs(chief));
			setGoals(initialPlanGoals(chief));
		}
	}

	const savedAt = chief.heroGearPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Plan Hero Gear"
			description="Mastery forging, enhancement and empowerment of any pieces, from any set"
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							Plan saved {formatDateTime(savedAt)}
						</span>
					)}
					<Button onClick={onClose}>Close</Button>
					<Button variant="primary" onClick={() => onSave(refs, goals)}>
						Save plan
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
	const plan = useMemo(() => runGearPlan(chief, refs, goals), [chief, refs, goals]);

	return (
		<>
			<AddPiece chief={chief} refs={refs} onAdd={(ref) => onRefsChange([...refs, ref])} />
			{plan.rows.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">
						No pieces in the plan yet. Add a piece above, then raise its goals.
					</p>
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
	const sets = gearSetsOf(chief);
	const [setId, setSetId] = useState("");
	const [slot, setSlot] = useState<HeroGearSlot>("goggles");
	const selectedSetId = sets.some((set) => set.id === setId) ? setId : (sets[0]?.id ?? "");
	const taken = refs.some((ref) => ref.setId === selectedSetId && ref.slot === slot);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">Add a piece</h3>
			{sets.length === 0 ? (
				<p className="text-muted">Add a gear set on the Hero Gear tab first.</p>
			) : (
				<>
					<div className="flex flex-wrap gap-3">
						<div className="min-w-40 flex-1">
							<Select
								aria-label="Gear set"
								value={selectedSetId}
								onChange={(event) => setSetId(event.target.value)}
							>
								{sets.map((set) => (
									<option key={set.id} value={set.id}>
										{set.name} ({troopLabel(set.troopType)})
									</option>
								))}
							</Select>
						</div>
						<div className="min-w-32 flex-1">
							<Select
								aria-label="Piece"
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
							Add piece
						</Button>
					</div>
					{taken && (
						<p className="text-muted text-xs">This piece is already in the plan.</p>
					)}
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
	const { set, piece, goal, ref } = row;
	const title = `${set.name} · ${slotName(ref.slot)}`;
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
						{!isMythic(piece) && <Badge tone="locked">{qualityOf(piece)}</Badge>}
					</span>
				</div>
				<IconButton
					label={`Remove ${title} from the plan`}
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
							<SectionLabel className="text-muted">Forging current row</SectionLabel>
							<p className="font-mono text-xs">{rowLabel(piece.forging)}</p>
						</div>
						<div className="flex flex-col gap-1">
							<SectionLabel className="text-muted">Forging goal row</SectionLabel>
							<Select
								aria-label={`${title} forging goal`}
								value={goal.forging ?? ""}
								onChange={(event) =>
									change({ forging: event.target.value || null })
								}
							>
								<option value="" disabled={piece.forging !== null}>
									None
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
						<p className="text-muted text-xs">
							Mastery forging stops at level 10 until the enhancement goal is 100.
						</p>
					)}
				</>
			)}
			<div className="flex items-center justify-between gap-3">
				<span>Enhancement</span>
				<span className="flex items-center gap-2">
					<span className="text-muted font-mono text-xs">{piece.enhancement} to</span>
					<ValueStepper
						label={`${title} enhancement goal`}
						value={goal.enhancement}
						min={piece.enhancement}
						max={MAX_ENHANCEMENT}
						onChange={(enhancement) => change({ enhancement })}
					/>
				</span>
			</div>
			{lock ? (
				<div className="border-line flex flex-wrap items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed p-2">
					<span>Empowerment</span>
					<span className="text-muted font-mono text-xs">{lockText(lock)}</span>
				</div>
			) : (
				<div className="flex items-center justify-between gap-3">
					<span>Empowerment</span>
					<span className="flex items-center gap-2">
						<span className="text-muted font-mono text-xs">{piece.empowerment} to</span>
						<ValueStepper
							label={`${title} empowerment goal`}
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

const rowLabel = (id: string | null) => {
	const row = forgingRows.find((item) => item.id === id);
	return row ? `${row.name} (+${row.statsUpPercent}%)` : "None";
};

function PlanResult({ plan }: { plan: GearPlanResult }) {
	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">
				Result for {plan.rows.length} {plan.rows.length === 1 ? "piece" : "pieces"}
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
				<SectionLabel className="text-muted pb-1">Power</SectionLabel>
				{[
					["Power gained", plan.power],
					["Power of these pieces before", plan.currentPower],
					["Power of these pieces after", plan.goalPower],
				].map(([label, value]) => (
					<div
						key={label}
						className="border-line flex justify-between border-t-[1.5px] py-1.5 first:border-t-0"
					>
						<span>{label}</span>
						<span className="font-mono font-medium">{formatNumber(Number(value))}</span>
					</div>
				))}
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[26rem] text-left">
					<thead>
						<tr>
							{["Piece", "Forging stats up", "Power gained"].map((head) => (
								<th key={head} className="py-1 pr-3">
									<SectionLabel className="text-muted">{head}</SectionLabel>
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
								<td className="py-1.5 pr-3 font-medium">
									{row.set.name} · {slotName(row.ref.slot)}
								</td>
								<td className="pr-3 font-mono">
									+{row.calculation.masteryForging.statsUpPercent}% (
									{row.calculation.masteryForging.steps} steps)
								</td>
								<td className="font-mono">{formatNumber(row.calculation.power)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{plan.milestones.length > 0 && (
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">Milestones unlocked</SectionLabel>
					{plan.milestones.map((item) => (
						<p key={`${item.label}${item.stat}`}>
							{item.label}: {item.stat}
						</p>
					))}
				</div>
			)}
			<div className="grid grid-cols-3 gap-3">
				{[
					["SvS", plan.eventPoints.svs],
					["Alliance Showdown", plan.eventPoints.allianceShowdown],
					["King of Icefield", plan.eventPoints.kingOfIcefield],
				].map(([name, value]) => (
					<div
						key={name}
						className="border-line flex flex-col rounded-md border-[1.5px] p-2"
					>
						<span className="text-muted text-xs">{name}</span>
						<span className="font-mono font-semibold">
							{formatNumber(Number(value))}
						</span>
					</div>
				))}
			</div>
			<p className="text-muted text-xs">
				Plan Hero Gear has no speed or bonus controls. The calculator returns no time.
			</p>
		</Card>
	);
}
