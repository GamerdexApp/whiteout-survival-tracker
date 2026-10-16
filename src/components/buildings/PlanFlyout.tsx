"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { Appointment, Playthrough } from "@/types/app";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { constructionSpeedBonusPercent } from "@/service/bonuses";
import { exportSpecOf } from "@/service/buildingExport";
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
import type { AgeHints } from "@/service/buildings";
import { ageHintOf, buildView, levelOrder, lockedFcHints } from "@/service/buildings";
import { exportedPlanOf } from "@/service/eventExport";
import { minutesOfSpeedup } from "@/service/inventory";
import { petSkillConstructionPercent } from "@/service/pets";
import { resourceChecks } from "@/service/planStock";
import { findBuildingById, levelledBuildings } from "@/data/game/buildings";
import { findItem, RESOURCE_ITEM_IDS } from "@/data/game/items";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
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

const appointmentIds: Appointment[] = ["none", "regular", "supreme"];

export function PlanFlyout({ open, chief, onClose, onSave }: PlanFlyoutProps) {
	const t = useTranslations("buildings");
	const [wasOpen, setWasOpen] = useState(false);
	const [exportBaseline, setExportBaseline] = useState<{ savedAt: string | null } | null>(null);
	const [rows, setRows] = useState<PlanRow[]>([]);
	const [controls, setControls] = useState<PlanControls>(() => defaultPlanControls(chief));

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setExportBaseline(null);
			setRows(initialPlanRows(chief));
			setControls(defaultPlanControls(chief));
		}
	}

	const [exportOpen, setExportOpen] = useState(false);
	const { ui } = useUiSettings();
	const bonusesPercent = useMemo(
		() => (ui.calcUseBonuses ? constructionSpeedBonusPercent(chief) : 0),
		[ui.calcUseBonuses, chief]
	);
	const petSkillPercent = petSkillConstructionPercent(chief);
	const speedPercent = constructionSpeedPercent(controls, petSkillPercent, bonusesPercent);
	const result = useMemo(() => {
		if (rows.length === 0) return null;
		try {
			return { ok: true as const, calculation: runPlan(rows, chief, speedPercent) };
		} catch (error) {
			return {
				ok: false as const,
				error: error instanceof Error ? error.message : t("plan.failed"),
			};
		}
	}, [rows, chief, speedPercent, t]);
	const exportSpec = result?.ok ? exportSpecOf(chief, result.calculation) : null;
	const exportedAt = exportedPlanOf(chief, "buildings")?.savedAt ?? null;

	useEffect(() => {
		if (!exportOpen && exportBaseline && exportedAt !== exportBaseline.savedAt) {
			onClose();
		}
	}, [exportOpen, exportBaseline, exportedAt, onClose]);

	const openExport = () => {
		setExportBaseline({ savedAt: exportedAt });
		setExportOpen(true);
	};

	const savedAt = chief.buildingPlan?.savedAt;

	return (
		<>
			<Flyout
				open={open}
				onClose={onClose}
				title={t("plan.title")}
				description={t("plan.description")}
				footer={
					<>
						{savedAt && (
							<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
								<span
									aria-hidden="true"
									className="bg-kept size-1.5 rounded-full"
								/>
								{t("plan.saved", { time: formatDateTime(savedAt) })}
							</span>
						)}
						<Button onClick={onClose}>{t("close")}</Button>
						<Button
							variant="ghost"
							disabled={!exportSpec}
							title={exportSpec ? undefined : t("plan.export.empty")}
							onClick={openExport}
						>
							{t("plan.export.button")}
						</Button>
						<Button variant="primary" onClick={() => onSave(rows, controls)}>
							{t("plan.save")}
						</Button>
					</>
				}
			>
				<PlanBody
					chief={chief}
					rows={rows}
					controls={controls}
					result={result}
					bonusesPercent={bonusesPercent}
					petSkillPercent={petSkillPercent}
					speedPercent={speedPercent}
					bonusesOn={ui.calcUseBonuses}
					onRowsChange={setRows}
					onControlsChange={setControls}
				/>
			</Flyout>
			{exportSpec && (
				<ExportToEventFlyout
					open={exportOpen}
					chief={chief}
					spec={exportSpec}
					onClose={() => setExportOpen(false)}
				/>
			)}
		</>
	);
}

type PlanOutcome =
	{ ok: true; calculation: ReturnType<typeof runPlan> } | { ok: false; error: string } | null;

interface PlanBodyProps {
	chief: Playthrough;
	rows: PlanRow[];
	controls: PlanControls;
	result: PlanOutcome;
	bonusesPercent: number;
	petSkillPercent: number;
	speedPercent: number;
	bonusesOn: boolean;
	onRowsChange: (rows: PlanRow[]) => void;
	onControlsChange: (controls: PlanControls) => void;
}

function PlanBody({
	chief,
	rows,
	controls,
	result,
	bonusesPercent,
	petSkillPercent,
	speedPercent,
	bonusesOn,
	onRowsChange,
	onControlsChange,
}: PlanBodyProps) {
	const t = useTranslations("buildings");
	const fcHints = useMemo(() => lockedFcHints(chief), [chief]);

	return (
		<>
			<AddBuilding chief={chief} rows={rows} onAdd={(row) => onRowsChange([...rows, row])} />
			<Card className="flex flex-col gap-4 p-4">
				<h3 className="font-semibold">
					{t("plan.goalsHeading", {
						count: rows.length,
						amount: formatNumber(rows.length),
					})}
				</h3>
				<SpeedControls
					controls={controls}
					bonusesPercent={bonusesPercent}
					bonusesOn={bonusesOn}
					petSkillPercent={petSkillPercent}
					speedPercent={speedPercent}
					onChange={onControlsChange}
				/>
				{rows.length === 0 ? (
					<p className="text-muted">{t("plan.noGoals")}</p>
				) : (
					<ul className="flex flex-col">
						{rows.map((row) => (
							<GoalRow
								key={row.id}
								row={row}
								fcHints={fcHints}
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
				<p className="text-muted text-xs">{t("plan.prerequisiteNote")}</p>
			</Card>
			{result && !result.ok && <Note tone="warning">{result.error}</Note>}
			{result?.ok && (
				<PlanStockCheck
					checks={resourceChecks(result.calculation, chief)}
					timeNote={t("plan.timeNote", {
						time: formatDuration(result.calculation.seconds),
						percent: formatNumber(speedPercent),
						construction: formatNumber(minutesOfSpeedup(chief, "construction")),
						general: formatNumber(minutesOfSpeedup(chief, "general")),
					})}
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
	const t = useTranslations("buildings.plan.add");
	const available = levelledBuildings
		.filter((building) => !rows.some((row) => row.id === building.id))
		.map((building) => ({
			building,
			ageLock: buildView(building, chief).nextAgeLock,
		}));
	const [selectedId, setSelectedId] = useState("");
	const addable = available.filter((item) => item.ageLock === null);
	const selected = addable.some((item) => item.building.id === selectedId)
		? selectedId
		: (addable[0]?.building.id ?? "");

	const add = () => {
		const row = rowFor(chief, selected);
		if (row) onAdd(row);
	};

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			{available.length === 0 ? (
				<p className="text-muted">{t("allAdded")}</p>
			) : (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label={t("selectLabel")}
							value={selected}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{available.map(({ building, ageLock }) => (
								<option
									key={building.id}
									value={building.id}
									disabled={ageLock !== null}
								>
									{ageLock ? `${building.name} (${ageLock})` : building.name}
								</option>
							))}
						</Select>
					</div>
					<Button variant="primary" disabled={selected === ""} onClick={add}>
						<LuPlus size={16} aria-hidden="true" />
						{t("button")}
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
	petSkillPercent,
	speedPercent,
	onChange,
}: {
	controls: PlanControls;
	bonusesPercent: number;
	bonusesOn: boolean;
	petSkillPercent: number;
	speedPercent: number;
	onChange: (controls: PlanControls) => void;
}) {
	const t = useTranslations("buildings.plan.speed");
	const percent = (value: number) => t("percent", { value: formatNumber(value) });
	const plusPercent = (value: number) => t("plusPercent", { value: formatNumber(value) });
	const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
	const appointmentOptions = appointmentIds.map((id) => ({
		id,
		label: t(`appointments.${id}`),
	}));

	return (
		<div className="border-line bg-tint flex flex-col gap-3 rounded-md border-[1.5px] p-3">
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("title")}</span>
				<span className="flex items-center gap-2">
					<span className="font-mono font-medium">{percent(bonusesPercent)}</span>
					<Badge tone="added">{t("readOnly")}</Badge>
				</span>
			</div>
			<p className="text-muted text-xs">
				{bonusesOn ? t("bonusesOn") : t("bonusesOff")}{" "}
				<Link href="/bonuses" className="text-link underline">
					{t("openBonuses")}
				</Link>
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<span className="font-medium">{t("appointment")}</span>
				<span className="flex items-center gap-2">
					<SegmentedControl
						label={t("appointment")}
						options={appointmentOptions}
						value={controls.vicePresident}
						onChange={(vicePresident) => onChange({ ...controls, vicePresident })}
					/>
					<span className="font-mono text-xs">
						{plusPercent(APPOINTMENT_PERCENT[controls.vicePresident])}
					</span>
				</span>
			</div>
			<p className="text-muted text-xs">{t.rich("appointmentNote", { strong })}</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("petSkill")}</span>
				<span className="flex items-center gap-2">
					<Switch
						label={t("petSkill")}
						checked={controls.petSkill}
						disabled={petSkillPercent === 0}
						onChange={(petSkill) => onChange({ ...controls, petSkill })}
					/>
					<span className="font-mono text-xs">{plusPercent(petSkillPercent)}</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				{petSkillPercent === 0 ? t("petSkillNoteLocked") : t("petSkillNote")}
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("chiefOrder")}</span>
				<span className="flex items-center gap-2">
					<Switch
						label={t("chiefOrder")}
						checked={controls.chiefOrder}
						onChange={(chiefOrder) => onChange({ ...controls, chiefOrder })}
					/>
					<span className="font-mono text-xs">{plusPercent(DOUBLE_TIME_PERCENT)}</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				{t.rich("chiefOrderNote", {
					strong,
					percent: formatNumber(DOUBLE_TIME_PERCENT),
				})}
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-semibold">{t("total")}</span>
				<span className="text-primary font-mono font-semibold">
					{percent(speedPercent)}
				</span>
			</div>
		</div>
	);
}

function GoalRow({
	row,
	fcHints,
	onGoalChange,
	onRemove,
}: {
	row: PlanRow;
	fcHints: AgeHints;
	onGoalChange: (goal: string) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("buildings");
	const building = findBuildingById(row.id);
	if (!building) return null;

	const floor = Math.max(levelOrder(building, row.current), 1);
	const goals = building.levels.filter((level) => level.order >= floor);

	return (
		<li className="border-line flex flex-wrap items-center gap-x-3 gap-y-2 border-t-[1.5px] py-2 first:border-t-0">
			<span className="min-w-32 flex-1 font-medium">{building.name}</span>
			<span className="font-mono">{row.current ?? t("notBuilt")}</span>
			<span className="text-muted">{t("plan.goal.to")}</span>
			<div className="w-32">
				<Select
					aria-label={t("plan.goal.label", { name: building.name })}
					value={row.goal}
					onChange={(event) => onGoalChange(event.target.value)}
				>
					{goals.map((level) => {
						const hint = ageHintOf(fcHints, level.label);
						return (
							<option
								key={level.id}
								value={level.label}
								disabled={hint !== undefined}
							>
								{hint ? `${level.label} (${hint})` : level.label}
							</option>
						);
					})}
				</Select>
			</div>
			<IconButton
				label={t("plan.goal.remove", { name: building.name })}
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
	const t = useTranslations("buildings");
	const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
	const groups = groupSteps(calculation.steps);
	const amountOf = (itemId: string) =>
		calculation.resources.find((resource) => resource.itemId === itemId)?.amount ?? 0;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">
				{t("plan.result.title", { count: formatNumber(calculation.steps.length) })}
			</h3>
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
				<Stat
					label={t("plan.result.powerGained")}
					value={`+${formatNumber(calculation.power)}`}
				/>
				<Stat
					label={t("plan.result.speedupMinutes")}
					value={formatNumber(calculation.speedupMinutesNeeded)}
					emphasis
				/>
				<Stat
					label={t("plan.result.baseTime")}
					value={formatDuration(calculation.baseSeconds)}
				/>
				<Stat
					label={t("plan.result.timeWithBonus", { percent: formatNumber(speedPercent) })}
					value={formatDuration(calculation.seconds)}
				/>
			</div>
			<p className="text-muted text-xs">
				{t.rich("plan.result.eventPoints", {
					strong,
					svs: formatNumber(calculation.eventPoints.svs),
					king: formatNumber(calculation.eventPoints.kingOfIcefield),
				})}
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
									: t("levelRange", { from: group.fromLevel, to: group.toLevel })}
							</span>
							{group.prerequisite && (
								<Badge tone="added">{t("plan.result.prerequisite")}</Badge>
							)}
							<span className="ml-auto text-xs">
								{t("plan.result.steps", {
									count: group.steps,
									amount: formatNumber(group.steps),
								})}
							</span>
						</li>
					))}
				</ul>
			)}
			<div>
				<SectionLabel className="text-muted">{t("plan.result.unmetHeading")}</SectionLabel>
				<p className="mt-1">
					{calculation.unmetPrerequisites.length === 0
						? t("plan.result.unmetNone")
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
