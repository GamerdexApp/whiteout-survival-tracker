"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatDateTime, formatDecimal, formatNumber } from "@/lib/format";
import { exportSpecOf, petPlanScores } from "@/service/petExport";
import type { PetGoals, PetPlanResult, PetPlanRow, PetView } from "@/service/pets";
import {
	buildPetViews,
	initialPetGoals,
	isAdvanceLevel,
	petPlanChecks,
	petPowerGain,
	runPetPlan,
	startingPetGoal,
	withGoalLevel,
} from "@/service/pets";
import { findItem } from "@/data/game/items";
import { PLAN_ITEM_IDS } from "@/data/game/pets";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { PlanFooter } from "@/comps/ui/PlanFooter";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { PetNumberField } from "./PetNumberField";

interface PetPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (goals: PetGoals) => void;
}

export function PetPlanFlyout({ open, chief, onClose, onSave }: PetPlanFlyoutProps) {
	const t = useTranslations("pets.plan");
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<PetGoals>({});
	const [exporting, setExporting] = useState(false);
	const plan = useMemo(() => runPetPlan(chief, goals), [chief, goals]);
	const canExport = petPlanScores(plan);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setGoals(initialPetGoals(chief));
	}

	const savedAt = chief.petsPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<PlanFooter
					savedText={
						savedAt ? t("saved", { date: formatDateTime(savedAt) }) : t("notSavedYet")
					}
					closeLabel={t("close")}
					onClose={onClose}
					exportAction={{
						disabled: !canExport,
						title: canExport ? undefined : t("exportNothing"),
						onClick: () => setExporting(true),
						label: t("exportButton"),
					}}
					saveLabel={t("save")}
					onSave={() => onSave(goals)}
				/>
			}
		>
			<PlanBody chief={chief} goals={goals} plan={plan} onGoalsChange={setGoals} />
			<ExportToEventFlyout
				open={exporting}
				chief={chief}
				spec={exportSpecOf(plan, chief)}
				onClose={() => setExporting(false)}
			/>
		</Flyout>
	);
}

function PlanBody({
	chief,
	goals,
	plan,
	onGoalsChange,
}: {
	chief: Playthrough;
	goals: PetGoals;
	plan: PetPlanResult;
	onGoalsChange: (goals: PetGoals) => void;
}) {
	const t = useTranslations("pets.plan");
	const views = useMemo(() => buildPetViews(chief), [chief]);
	const addable = views.filter((view) => view.unlocked && !goals[view.pet.id]);

	return (
		<>
			<AddPet
				addable={addable}
				hasUnlocked={views.some((view) => view.unlocked)}
				onAdd={(view) => onGoalsChange({ ...goals, [view.pet.id]: startingPetGoal(view) })}
			/>
			{plan.rows.map((row) => (
				<PetBlock
					key={row.view.pet.id}
					row={row}
					onGoalChange={(goal) => onGoalsChange({ ...goals, [row.view.pet.id]: goal })}
					onRemove={() =>
						onGoalsChange(
							Object.fromEntries(
								Object.entries(goals).filter(([petId]) => petId !== row.view.pet.id)
							)
						)
					}
				/>
			))}
			{plan.rows.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("noPets")}</p>
				</Card>
			) : (
				<>
					<PlanStockCheck checks={petPlanChecks(plan, chief)} timeNote="" />
					<PlanResult plan={plan} />
				</>
			)}
		</>
	);
}

function AddPet({
	addable,
	hasUnlocked,
	onAdd,
}: {
	addable: PetView[];
	hasUnlocked: boolean;
	onAdd: (view: PetView) => void;
}) {
	const t = useTranslations("pets.plan.add");
	const [selectedId, setSelectedId] = useState("");
	const selected = addable.find((view) => view.pet.id === selectedId) ?? addable[0];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			{selected ? (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label={t("selectLabel")}
							value={selected.pet.id}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{addable.map((view) => (
								<option key={view.pet.id} value={view.pet.id}>
									{view.pet.name}
								</option>
							))}
						</Select>
					</div>
					<Button variant="primary" onClick={() => onAdd(selected)}>
						<LuPlus size={16} aria-hidden="true" />
						{t("button")}
					</Button>
				</div>
			) : (
				<p className="text-muted">{hasUnlocked ? t("allIn") : t("noneUnlocked")}</p>
			)}
		</Card>
	);
}

function PetBlock({
	row,
	onGoalChange,
	onRemove,
}: {
	row: PetPlanRow;
	onGoalChange: (goal: PetPlanRow["goal"]) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("pets.plan.block");
	const { view, goal } = row;
	const { pet } = view;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 className="font-semibold">{pet.name}</h3>
						<Badge tone="changed">{t(`rarities.${pet.rarity}`)}</Badge>
					</div>
					<span className="text-muted font-mono text-xs">
						{t("maxLevel", { max: formatNumber(pet.maxLevel) })}
					</span>
				</div>
				<Button
					variant="danger"
					onClick={onRemove}
					aria-label={t("removeLabel", { pet: pet.name })}
				>
					{t("remove")}
				</Button>
			</div>
			<div className="flex items-end gap-2">
				<div className="flex w-20 shrink-0 flex-col gap-1.5">
					<span className="font-medium">{t("current")}</span>
					<span className="border-line bg-tint flex min-h-11 items-center justify-center rounded-md border-[1.5px] font-mono font-medium lg:min-h-9">
						{formatNumber(view.level)}
					</span>
				</div>
				<span className="text-muted flex min-h-11 items-center lg:min-h-9">{t("to")}</span>
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<span className="font-medium">
						{t("goal", { max: formatNumber(pet.maxLevel) })}
					</span>
					<div className="flex">
						<PetNumberField
							label={t("goalLabel", { pet: pet.name })}
							value={goal.level}
							min={view.level}
							max={pet.maxLevel}
							step={1}
							display={formatNumber}
							onChange={(level) => onGoalChange(withGoalLevel(view, goal, level))}
						/>
					</div>
				</div>
			</div>
			<label
				className={`flex min-h-11 items-center gap-2 lg:min-h-9 ${isAdvanceLevel(goal.level) ? "cursor-pointer" : "text-muted cursor-not-allowed"}`}
			>
				<input
					type="checkbox"
					checked={goal.advanceAtGoal && isAdvanceLevel(goal.level)}
					disabled={!isAdvanceLevel(goal.level)}
					onChange={(event) =>
						onGoalChange({ ...goal, advanceAtGoal: event.target.checked })
					}
					className="accent-primary size-4"
				/>
				{t("payAdvancement")}
			</label>
			{row.paysCurrentAdvancement && (
				<p className="text-muted text-xs">
					{t("paysCurrent", { level: formatNumber(view.level) })}
				</p>
			)}
		</Card>
	);
}

const EVENT_KEYS = ["svs", "allianceShowdown", "kingOfIcefield"] as const;

function PlanResult({ plan }: { plan: PetPlanResult }) {
	const t = useTranslations("pets.plan.result");
	const { total } = plan;
	const unknown = t("unknown");
	const power = (value: number | null) => (value === null ? unknown : formatNumber(value));
	const gains = [
		{ id: "levels", value: formatNumber(total.levels) },
		{ id: "advancements", value: formatNumber(total.advancements) },
		{ id: "attack", value: t("percentGain", { value: formatDecimal(total.troopAttack) }) },
		{ id: "defense", value: t("percentGain", { value: formatDecimal(total.troopDefense) }) },
		{ id: "power", value: power(plan.totalPower) },
		{ id: "score", value: formatNumber(total.advancementScore) },
	] as const;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">
				{t("title", { count: plan.rows.length, amount: formatNumber(plan.rows.length) })}
			</h3>
			<div className="flex flex-col">
				<SectionLabel className="text-muted pb-1">{t("resources")}</SectionLabel>
				{PLAN_ITEM_IDS.map((itemId) => {
					const item = findItem(itemId);
					return (
						<div
							key={itemId}
							className="border-line flex min-h-9 items-center gap-2 border-t-[1.5px] py-1 first:border-t-0"
						>
							<ItemIcon src={item?.img} size={24} />
							<span className="flex-1">{item?.name ?? itemId}</span>
							<span className="font-mono">{formatNumber(plan.needs[itemId])}</span>
						</div>
					);
				})}
			</div>
			<div className="flex flex-col">
				<SectionLabel className="text-muted pb-1">{t("byPet")}</SectionLabel>
				<table className="w-full text-start">
					<thead>
						<tr className="text-muted font-mono text-[11px] uppercase">
							<th className="py-1 pe-2 font-normal">{t("heads.pet")}</th>
							<th className="px-2 text-end font-normal">{t("heads.levels")}</th>
							<th className="px-2 text-end font-normal">{t("heads.food")}</th>
							<th className="ps-2 text-end font-normal">{t("heads.power")}</th>
						</tr>
					</thead>
					<tbody>
						{plan.rows.map((row) => {
							const food = row.calculation.resources.find(
								(resource) => resource.itemId === PLAN_ITEM_IDS[0]
							);
							const gain = petPowerGain(row.calculation);
							return (
								<tr key={row.view.pet.id} className="border-line border-t-[1.5px]">
									<td className="py-2 pe-2">{row.view.pet.name}</td>
									<td className="px-2 text-end font-mono">
										{formatNumber(row.calculation.levels)}
									</td>
									<td className="px-2 text-end font-mono">
										{formatNumber(food?.amount ?? 0)}
									</td>
									<td className="ps-2 text-end font-mono">
										{gain === null
											? unknown
											: t("powerGain", { value: formatNumber(gain) })}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="flex flex-col">
				<SectionLabel className="text-muted pb-1">{t("gains")}</SectionLabel>
				{gains.map((gain) => (
					<div
						key={gain.id}
						className="border-line flex min-h-9 items-center justify-between gap-2 border-t-[1.5px] py-1 first:border-t-0"
					>
						<span>{t(`gainNames.${gain.id}`)}</span>
						<span className="font-mono">{gain.value}</span>
					</div>
				))}
			</div>
			{plan.totalPower === null && <Note>{t("unknownPowerNote")}</Note>}
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("eventPoints")}</SectionLabel>
				<div className="grid grid-cols-2 gap-3">
					{EVENT_KEYS.map((key) => (
						<div
							key={key}
							className="border-line flex flex-col rounded-md border-[1.5px] p-2"
						>
							<span className="text-muted text-xs">{t(`events.${key}`)}</span>
							<span className="font-mono font-semibold">
								{formatNumber(total.eventPoints[key])}
							</span>
						</div>
					))}
					<div className="border-line flex flex-col rounded-md border-[1.5px] p-2">
						<span className="text-muted text-xs">{t("events.hallOfChief")}</span>
						<span className="font-mono font-semibold">{t("notScored")}</span>
					</div>
				</div>
				<p className="text-muted text-xs">{t("eventNote")}</p>
				<p className="text-muted text-xs">{t("scoreSourceNote")}</p>
			</div>
		</Card>
	);
}
