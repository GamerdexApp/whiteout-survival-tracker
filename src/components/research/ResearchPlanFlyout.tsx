"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { Appointment, Playthrough } from "@/types/app";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { researchSpeedBonusPercent } from "@/service/bonuses";
import { minutesOfSpeedup } from "@/service/inventory";
import { researchChecks } from "@/service/planStock";
import { levelOfNode } from "@/service/research";
import type { ResearchPlanControls, ResearchPlanRow } from "@/service/researchPlan";
import {
	defaultResearchControls,
	initialResearchRows,
	researchSpeedPercent,
	rowForNode,
	runResearchPlan,
	STATE_BUFF_PERCENT,
	VICE_PRESIDENT_PERCENT,
} from "@/service/researchPlan";
import { findItem } from "@/data/game/items";
import {
	allResearch,
	findResearch,
	maxLevelOf,
	nodesOfTab,
	researchTabs,
	tabName,
} from "@/data/game/research";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";

interface ResearchPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (rows: ResearchPlanRow[], controls: ResearchPlanControls) => void;
}

const appointmentIds: Appointment[] = ["none", "regular", "supreme"];

export function ResearchPlanFlyout({ open, chief, onClose, onSave }: ResearchPlanFlyoutProps) {
	const t = useTranslations("research");
	const [wasOpen, setWasOpen] = useState(false);
	const [rows, setRows] = useState<ResearchPlanRow[]>([]);
	const [controls, setControls] = useState<ResearchPlanControls>(() =>
		defaultResearchControls(chief)
	);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setRows(initialResearchRows(chief));
			setControls(defaultResearchControls(chief));
		}
	}

	const savedAt = chief.researchPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("plan.title")}
			description={t("plan.description")}
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							{t("plan.saved", { date: formatDateTime(savedAt) })}
						</span>
					)}
					<Button onClick={onClose}>{t("plan.close")}</Button>
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
				onRowsChange={setRows}
				onControlsChange={setControls}
			/>
		</Flyout>
	);
}

interface PlanBodyProps {
	chief: Playthrough;
	rows: ResearchPlanRow[];
	controls: ResearchPlanControls;
	onRowsChange: (rows: ResearchPlanRow[]) => void;
	onControlsChange: (controls: ResearchPlanControls) => void;
}

function PlanBody({ chief, rows, controls, onRowsChange, onControlsChange }: PlanBodyProps) {
	const t = useTranslations("research");
	const { ui } = useUiSettings();
	const bonusesPercent = useMemo(
		() => (ui.calcUseBonuses ? researchSpeedBonusPercent(chief) : 0),
		[ui.calcUseBonuses, chief]
	);
	const speedPercent = researchSpeedPercent(controls, bonusesPercent);

	const result = useMemo(() => {
		if (rows.length === 0) return null;
		try {
			return {
				ok: true as const,
				calculation: runResearchPlan(rows, chief, controls, bonusesPercent),
			};
		} catch (error) {
			return {
				ok: false as const,
				error: error instanceof Error ? error.message : null,
			};
		}
	}, [rows, chief, controls, bonusesPercent]);

	return (
		<>
			<AddNode chief={chief} rows={rows} onAdd={(row) => onRowsChange([...rows, row])} />
			<Card className="flex flex-col gap-4 p-4">
				<h3 className="font-semibold">
					{t("plan.goals", {
						nodes: t("nodeCount", {
							count: rows.length,
							amount: formatNumber(rows.length),
						}),
					})}
				</h3>
				<SpeedControls
					controls={controls}
					bonusesPercent={bonusesPercent}
					bonusesOn={ui.calcUseBonuses}
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
				<p className="text-muted text-xs">{t("plan.goalsHint")}</p>
			</Card>
			{result && !result.ok && <Note tone="warning">{result.error ?? t("plan.failed")}</Note>}
			{result?.ok && (
				<PlanStockCheck
					checks={researchChecks(result.calculation, chief)}
					timeNote={t("plan.timeNote", {
						time: formatDuration(result.calculation.seconds),
						percent: formatNumber(speedPercent),
						research: formatNumber(minutesOfSpeedup(chief, "research")),
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

function AddNode({
	chief,
	rows,
	onAdd,
}: {
	chief: Playthrough;
	rows: ResearchPlanRow[];
	onAdd: (row: ResearchPlanRow) => void;
}) {
	const t = useTranslations("research");
	const planned = new Set(rows.map((row) => row.id));
	const addable = (node: (typeof allResearch)[number]) =>
		!planned.has(node.id) && levelOfNode(chief, node) < maxLevelOf(node);
	const first = allResearch.find(addable)?.id ?? "";
	const [selectedId, setSelectedId] = useState("");
	const selected =
		selectedId && addable(findResearch(selectedId) ?? allResearch[0]) ? selectedId : first;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("plan.add.title")}</h3>
			{!first ? (
				<p className="text-muted">{t("plan.add.none")}</p>
			) : (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label={t("plan.add.select")}
							value={selected}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{researchTabs.map((tab) => (
								<optgroup key={tab.id} label={tabName(tab)}>
									{nodesOfTab(tab)
										.filter(addable)
										.map((node) => (
											<option key={node.id} value={node.id}>
												{node.name}
											</option>
										))}
								</optgroup>
							))}
						</Select>
					</div>
					<Button
						variant="primary"
						onClick={() => {
							const row = rowForNode(chief, selected);
							if (row) onAdd(row);
						}}
					>
						<LuPlus size={16} aria-hidden="true" />
						{t("plan.add.button")}
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
	controls: ResearchPlanControls;
	bonusesPercent: number;
	bonusesOn: boolean;
	speedPercent: number;
	onChange: (controls: ResearchPlanControls) => void;
}) {
	const t = useTranslations("research");
	const appointmentOptions = appointmentIds.map((id) => ({
		id,
		label: t(`plan.appointment.${id}`),
	}));

	return (
		<div className="border-line bg-tint flex flex-col gap-3 rounded-md border-[1.5px] p-3">
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("plan.speed.title")}</span>
				<span className="flex items-center gap-2">
					<span className="font-mono font-medium">
						{t("plan.percent", { value: formatNumber(bonusesPercent) })}
					</span>
					<Badge tone="added">{t("plan.speed.readOnly")}</Badge>
				</span>
			</div>
			<p className="text-muted text-xs">
				{bonusesOn ? t("plan.speed.carriedOver") : t("plan.speed.turnedOff")}{" "}
				<Link href="/bonuses" className="text-link underline">
					{t("plan.speed.openBonuses")}
				</Link>
			</p>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("plan.speed.stateBuff")}</span>
				<span className="flex items-center gap-2">
					<Switch
						label={t("plan.speed.stateBuff")}
						checked={controls.stateBuff}
						onChange={(stateBuff) => onChange({ ...controls, stateBuff })}
					/>
					<span className="font-mono text-xs">
						{t("plan.percentPlus", { value: formatNumber(STATE_BUFF_PERCENT) })}
					</span>
				</span>
			</div>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<span className="font-medium">{t("plan.speed.vicePresident")}</span>
				<span className="flex items-center gap-2">
					<SegmentedControl
						label={t("plan.speed.vicePresident")}
						options={appointmentOptions}
						value={controls.vicePresident}
						onChange={(vicePresident) => onChange({ ...controls, vicePresident })}
					/>
					<span className="font-mono text-xs">
						{t("plan.percentPlus", {
							value: formatNumber(VICE_PRESIDENT_PERCENT[controls.vicePresident]),
						})}
					</span>
				</span>
			</div>
			<hr className="border-line border-t-[1.5px]" />
			<div className="flex items-center justify-between gap-3">
				<span className="font-semibold">{t("plan.speed.total")}</span>
				<span className="text-primary font-mono font-semibold">
					{t("plan.percent", { value: formatNumber(speedPercent) })}
				</span>
			</div>
		</div>
	);
}

function GoalRow({
	row,
	onGoalChange,
	onRemove,
}: {
	row: ResearchPlanRow;
	onGoalChange: (goal: number) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("research");
	const node = findResearch(row.id);
	if (!node) return null;

	const goals = node.levels.filter((level) => level.level >= Math.max(row.current, 1));

	return (
		<li className="border-line flex flex-wrap items-center gap-x-3 gap-y-2 border-t-[1.5px] py-2 first:border-t-0">
			<span className="min-w-32 flex-1 font-medium">{node.name}</span>
			<span className="font-mono">
				{t("plan.goal.level", { level: formatNumber(row.current) })}
			</span>
			<span className="text-muted">{t("plan.goal.to")}</span>
			<div className="w-28">
				<Select
					aria-label={t("plan.goal.label", { name: node.name })}
					value={row.goal}
					onChange={(event) => onGoalChange(Number(event.target.value))}
				>
					{goals.map((level) => (
						<option key={level.level} value={level.level}>
							{t("plan.goal.level", { level: formatNumber(level.level) })}
						</option>
					))}
				</Select>
			</div>
			<IconButton
				label={t("plan.goal.remove", { name: node.name })}
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
	calculation: ReturnType<typeof runResearchPlan>;
	speedPercent: number;
}) {
	const t = useTranslations("research");
	const lines = calculation.items.filter((item) => item.steps > 0);

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">
				{t("plan.result.title", { steps: formatNumber(calculation.steps) })}
			</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{calculation.resources.map((resource) => {
					const item = findItem(resource.itemId);
					return (
						<div key={resource.itemId} className="flex items-start gap-2">
							<ItemIcon src={item?.img} size={24} />
							<div className="flex flex-col">
								<span className="text-muted text-xs">
									{item?.name ?? resource.itemId}
								</span>
								<span className="font-mono font-semibold">
									{formatNumber(resource.amount)}
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
			{calculation.stepsWithoutTime > 0 && (
				<p className="text-muted text-xs">
					{t("plan.result.stepsWithoutTime", {
						count: calculation.stepsWithoutTime,
						amount: formatNumber(calculation.stepsWithoutTime),
					})}
				</p>
			)}
			{lines.length > 0 && (
				<ul className="flex flex-col">
					{lines.map((item) => (
						<li
							key={item.id}
							className="border-line flex flex-wrap items-center gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
						>
							<span className="font-medium">{item.name}</span>
							<span className="text-muted text-xs">{item.category}</span>
							<span className="ml-auto text-xs">
								{t("plan.result.stepCount", {
									count: item.steps,
									amount: formatNumber(item.steps),
								})}
							</span>
						</li>
					))}
				</ul>
			)}
			{calculation.buildingRequirements.length > 0 && (
				<div>
					<SectionLabel className="text-muted">
						{t("plan.result.buildingRequirements")}
					</SectionLabel>
					<p className="mt-1">
						{calculation.buildingRequirements
							.map((item) => `${item.id.replace(/-/g, " ")} ${item.level}`)
							.join(", ")}
					</p>
				</div>
			)}
			<div>
				<SectionLabel className="text-muted">{t("plan.result.unmet")}</SectionLabel>
				<p className="mt-1">
					{calculation.unmetPrerequisites.length === 0
						? t("plan.result.unmetNone")
						: calculation.unmetPrerequisites
								.map((item) =>
									t("plan.result.unmetItem", {
										name: findResearch(item.id)?.name ?? item.id,
										level: formatNumber(item.level),
										requires:
											findResearch(item.requires.id)?.name ??
											item.requires.id,
										requiresLevel: formatNumber(item.requires.level),
									})
								)
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
