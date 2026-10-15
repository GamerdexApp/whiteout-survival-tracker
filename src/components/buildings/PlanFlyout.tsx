"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { Appointment, Playthrough } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { constructionSpeedBonusPercent } from "@/service/bonuses";
import type { PlanControls, PlanRow } from "@/service/buildingPlan";
import {
	APPOINTMENT_PERCENT,
	constructionSpeedPercent,
	defaultPlanControls,
	DOUBLE_TIME_PERCENT,
	groupSteps,
	initialPlanRows,
	rowFor,
	runPlan,
} from "@/service/buildingPlan";
import { buildView, levelOrder } from "@/service/buildings";
import { minutesOfSpeedup } from "@/service/inventory";
import { resourceChecks } from "@/service/planStock";
import { findBuildingById, levelledBuildings } from "@/data/game/buildings";
import { findItem, RESOURCE_ITEM_IDS } from "@/data/game/items";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";

interface PlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (rows: PlanRow[], controls: PlanControls) => void;
}

const appointmentOptions: { id: Appointment; label: string }[] = [
	{ id: "none", label: "None" },
	{ id: "regular", label: "Regular" },
	{ id: "supreme", label: "Supreme" },
];

const formatSavedAt = (iso: string) =>
	new Date(iso).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});

// The Pets page decides this percent. Until it exists the skill cannot be turned on.
const PET_SKILL_PERCENT = 0;

export function PlanFlyout({ open, chief, onClose, onSave }: PlanFlyoutProps) {
	const [wasOpen, setWasOpen] = useState(false);
	const [rows, setRows] = useState<PlanRow[]>([]);
	const [controls, setControls] = useState<PlanControls>(() => defaultPlanControls(chief));

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setRows(initialPlanRows(chief));
			setControls(defaultPlanControls(chief));
		}
	}

	const savedAt = chief.buildingPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Plan Buildings"
			description="Resources, time and power from current level to goal"
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							Plan saved {formatSavedAt(savedAt)}
						</span>
					)}
					<Button onClick={onClose}>Close</Button>
					<Button variant="primary" onClick={() => onSave(rows, controls)}>
						Save plan
					</Button>
				</>
			}
		>
			<PlanBody
				chief={chief}
				rows={rows}
				controls={controls}
				onRowsChange={setRows}
				onControlsChange={setControls}
			/>
		</Flyout>
	);
}

interface PlanBodyProps {
	chief: Playthrough;
	rows: PlanRow[];
	controls: PlanControls;
	onRowsChange: (rows: PlanRow[]) => void;
	onControlsChange: (controls: PlanControls) => void;
}

function PlanBody({ chief, rows, controls, onRowsChange, onControlsChange }: PlanBodyProps) {
	const { ui } = useUiSettings();
	const bonusesPercent = useMemo(
		() => (ui.calcUseBonuses ? constructionSpeedBonusPercent(chief) : 0),
		[ui.calcUseBonuses, chief]
	);
	const speedPercent = constructionSpeedPercent(controls, PET_SKILL_PERCENT, bonusesPercent);
	const result = useMemo(() => {
		if (rows.length === 0) return null;
		try {
			return { ok: true as const, calculation: runPlan(rows, chief, speedPercent) };
		} catch (error) {
			return {
				ok: false as const,
				error: error instanceof Error ? error.message : "The plan could not be worked out.",
			};
		}
	}, [rows, chief, speedPercent]);

	return (
		<>
			<AddBuilding chief={chief} rows={rows} onAdd={(row) => onRowsChange([...rows, row])} />
			<Card className="flex flex-col gap-4 p-4">
				<h3 className="font-semibold">
					Goals, {rows.length} {rows.length === 1 ? "building" : "buildings"}
				</h3>
				<SpeedControls
					controls={controls}
					bonusesPercent={bonusesPercent}
					bonusesOn={ui.calcUseBonuses}
					speedPercent={speedPercent}
					onChange={onControlsChange}
				/>
				{rows.length === 0 ? (
					<p className="text-muted">
						No goals yet. Add a building above, then pick the level you want it to
						reach.
					</p>
				) : (
					<ul className="flex flex-col">
						{rows.map((row) => (
							<GoalRow
								key={row.id}
								row={row}
								onGoalChange={(goal) =>
									onRowsChange(
										rows.map((item) =>
											item.id === row.id ? { ...item, goal } : item
										)
									)
								}
								onRemove={() =>
									onRowsChange(rows.filter((item) => item.id !== row.id))
								}
							/>
						))}
					</ul>
				)}
				<p className="text-muted text-xs">
					Prerequisite steps are added for you. A level that needs another building at a
					higher level counts those steps and flags them.
				</p>
			</Card>
			{result && !result.ok && <Note tone="warning">{result.error}</Note>}
			{result?.ok && (
				<PlanStockCheck
					checks={resourceChecks(result.calculation, chief)}
					timeNote={`The plan takes ${formatDuration(result.calculation.seconds)} after the ${speedPercent}% speed bonus. Your stock: Construction ${formatNumber(minutesOfSpeedup(chief, "construction"))} min, General ${formatNumber(minutesOfSpeedup(chief, "general"))} min. General speedups count toward construction.`}
				/>
			)}
			{result?.ok && (
				<PlanResult calculation={result.calculation} speedPercent={speedPercent} />
			)}
		</>
	);
}

function AddBuilding({
	chief,
	rows,
	onAdd,
}: {
	chief: Playthrough;
	rows: PlanRow[];
	onAdd: (row: PlanRow) => void;
}) {
	const available = levelledBuildings.filter(
		(building) => !rows.some((row) => row.id === building.id)
	);
	const [selectedId, setSelectedId] = useState("");
	const selected = available.some((building) => building.id === selectedId)
		? selectedId
		: (available[0]?.id ?? "");

	const add = () => {
		const row = rowFor(chief, selected);
		if (row) onAdd(row);
	};

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">Add a building</h3>
			{available.length === 0 ? (
				<p className="text-muted">Every building is already in the plan.</p>
			) : (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label="Building to add"
							value={selected}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{available.map((building) => (
								<option key={building.id} value={building.id}>
									{building.name}
								</option>
							))}
						</Select>
					</div>
					<Button variant="primary" onClick={add}>
						<LuPlus size={16} aria-hidden="true" />
						Add building
					</Button>
				</div>
			)}
		</Card>
	);
}

function SpeedControls({
	controls,
	bonusesPercent,
	bonusesOn,
	speedPercent,
	onChange,
}: {
	controls: PlanControls;
	bonusesPercent: number;
	bonusesOn: boolean;
	speedPercent: number;
	onChange: (controls: PlanControls) => void;
}) {
	return (
		<div className="border-line bg-tint flex flex-col gap-3 rounded-md border-[1.5px] p-3">
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">Construction speed</span>
				<span className="flex items-center gap-2">
					<span className="font-mono font-medium">{bonusesPercent}%</span>
					<Badge tone="added">Read only</Badge>
				</span>
			</div>
			<p className="text-muted text-xs">
				{bonusesOn
					? "Carried over from the Bonuses page."
					: "Turned off in Settings, under Apply my Bonuses totals."}{" "}
				<Link href="/bonuses" className="text-link underline">
					Open Bonuses
				</Link>
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<span className="font-medium">President perks and appointment</span>
				<span className="flex items-center gap-2">
					<SegmentedControl
						label="President perks and appointment"
						options={appointmentOptions}
						value={controls.vicePresident}
						onChange={(vicePresident) => onChange({ ...controls, vicePresident })}
					/>
					<span className="font-mono text-xs">
						+{APPOINTMENT_PERCENT[controls.vicePresident]}%
					</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				Regular 10 percent, Supreme 15 percent. <strong>Estimate:</strong> the package
				states these values for research only.
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">Pet skill, Builder&apos;s Aide</span>
				<span className="flex items-center gap-2">
					<Switch
						label="Pet skill, Builder's Aide"
						checked={controls.petSkill}
						disabled
						onChange={() => {}}
					/>
					<span className="font-mono text-xs">+0%</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				The percent is managed by the Pets page. The switch stays off until that page can
				tell if the Cave Hyena is unlocked.
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">Chief order, Double Time</span>
				<span className="flex items-center gap-2">
					<Switch
						label="Chief order, Double Time"
						checked={controls.chiefOrder}
						onChange={(chiefOrder) => onChange({ ...controls, chiefOrder })}
					/>
					<span className="font-mono text-xs">+{DOUBLE_TIME_PERCENT}%</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				<strong>Estimate:</strong> adds {DOUBLE_TIME_PERCENT} percent construction speed for
				5 minutes. The package has no chief order data, so the value is entered by the app
				and applied to the whole time.
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-semibold">Total construction speed</span>
				<span className="text-primary font-mono font-semibold">{speedPercent}%</span>
			</div>
		</div>
	);
}

function GoalRow({
	row,
	onGoalChange,
	onRemove,
}: {
	row: PlanRow;
	onGoalChange: (goal: string) => void;
	onRemove: () => void;
}) {
	const building = findBuildingById(row.id);
	if (!building) return null;

	const floor = Math.max(levelOrder(building, row.current), 1);
	const goals = building.levels.filter((level) => level.order >= floor);

	return (
		<li className="border-line flex flex-wrap items-center gap-x-3 gap-y-2 border-t-[1.5px] py-2 first:border-t-0">
			<span className="min-w-32 flex-1 font-medium">{building.name}</span>
			<span className="font-mono">{row.current ?? "Not built"}</span>
			<span className="text-muted">to</span>
			<div className="w-32">
				<Select
					aria-label={`${building.name} goal`}
					value={row.goal}
					onChange={(event) => onGoalChange(event.target.value)}
				>
					{goals.map((level) => (
						<option key={level.id} value={level.label}>
							{level.label}
						</option>
					))}
				</Select>
			</div>
			<IconButton
				label={`Remove ${building.name} from the plan`}
				onClick={onRemove}
				className="text-danger hover:bg-tint"
			>
				<LuTrash2 size={18} aria-hidden="true" />
			</IconButton>
		</li>
	);
}

function PlanResult({
	calculation,
	speedPercent,
}: {
	calculation: ReturnType<typeof runPlan>;
	speedPercent: number;
}) {
	const groups = groupSteps(calculation.steps);
	const amountOf = (itemId: string) =>
		calculation.resources.find((resource) => resource.itemId === itemId)?.amount ?? 0;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">Result, {calculation.steps.length} steps</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{RESOURCE_ITEM_IDS.map((itemId) => {
					const item = findItem(itemId);
					return (
						<div key={itemId} className="flex items-start gap-2">
							{item?.img ? (
								<img
									src={item.img}
									alt=""
									width={24}
									height={24}
									className="size-6"
								/>
							) : (
								<span aria-hidden="true" className="bg-track size-6 rounded-sm" />
							)}
							<div className="flex flex-col">
								<span className="text-muted text-xs">{item?.name ?? itemId}</span>
								<span className="font-mono font-semibold">
									{formatNumber(amountOf(itemId))}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<Stat label="Power gained" value={`+${formatNumber(calculation.power)}`} />
				<Stat
					label="Speedup minutes needed"
					value={formatNumber(calculation.speedupMinutesNeeded)}
					emphasis
				/>
				<Stat label="Base time" value={formatDuration(calculation.baseSeconds)} />
				<Stat
					label={`Time with ${speedPercent}% bonus`}
					value={formatDuration(calculation.seconds)}
				/>
			</div>
			<p className="text-muted text-xs">
				Event points: SvS {formatNumber(calculation.eventPoints.svs)}, King of Icefield{" "}
				{formatNumber(calculation.eventPoints.kingOfIcefield)} (<strong>Estimate</strong>,
				from the scoring rows of events).
			</p>
			{groups.length > 0 && (
				<ul className="flex flex-col">
					{groups.map((group, index) => (
						<li
							key={`${group.buildingId}-${index}`}
							className="border-line flex flex-wrap items-center gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
						>
							<span className="font-medium">{group.name}</span>
							<span className="text-muted font-mono text-xs">
								{group.fromLevel === group.toLevel
									? group.fromLevel
									: `${group.fromLevel} to ${group.toLevel}`}
							</span>
							{group.prerequisite && <Badge tone="added">Prerequisite</Badge>}
							<span className="ml-auto text-xs">
								{group.steps} {group.steps === 1 ? "step" : "steps"}
							</span>
						</li>
					))}
				</ul>
			)}
			<div>
				<SectionLabel className="text-muted">Unmet prerequisites</SectionLabel>
				<p className="mt-1">
					{calculation.unmetPrerequisites.length === 0
						? "None for these goals. A building outside the list, such as Hero Hall, would show here."
						: calculation.unmetPrerequisites
								.map((item) => `${item.building} ${item.level}`)
								.join(", ")}
				</p>
			</div>
		</Card>
	);
}

function Stat({
	label,
	value,
	emphasis = false,
}: {
	label: string;
	value: string;
	emphasis?: boolean;
}) {
	return (
		<div className="bg-tint flex flex-col gap-0.5 rounded-md px-3 py-2">
			<span className="text-muted text-xs">{label}</span>
			<span className={`font-mono text-lg font-semibold ${emphasis ? "text-primary" : ""}`}>
				{value}
			</span>
		</div>
	);
}
