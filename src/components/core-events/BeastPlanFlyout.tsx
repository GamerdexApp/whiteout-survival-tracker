"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
	beastPlanScores,
	exportSpecOf,
	ginaLevelOptions,
	initialBeastPlan,
	MAX_BEAST_COUNT,
	runBeastPlan,
	staminaCansOf,
	totalPointsOf,
	withRunAdded,
	withRunChanged,
	withRunRemoved,
} from "@/service/beasts";
import type { BeastPlanDraft } from "@/service/beasts";
import {
	BEAST_CALCULATOR,
	beastLevelBandOf,
	beastLevelBands,
	STAMINA_CAN_ITEM_ID,
	staminaReductionOf,
} from "@/data/game/beasts";
import type { BeastCalculation } from "@/data/game/beasts";
import { findItem } from "@/data/game/items";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { CountInput } from "@/comps/troops/CountInput";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";

interface BeastPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (plan: BeastPlanDraft) => void;
}

export function BeastPlanFlyout({ open, chief, onClose, onSave }: BeastPlanFlyoutProps) {
	const t = useTranslations("coreEvents.beasts");
	const [wasOpen, setWasOpen] = useState(false);
	const [plan, setPlan] = useState<BeastPlanDraft>(() => initialBeastPlan(chief));
	const [exporting, setExporting] = useState(false);
	const result = useMemo(() => runBeastPlan(plan, chief), [plan, chief]);
	const canExport = beastPlanScores(plan, result);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setPlan(initialBeastPlan(chief));
	}

	const savedAt = chief.beastPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<span
						role="status"
						className="border-line bg-surface text-muted me-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs"
					>
						<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
						{savedAt ? t("saved", { date: formatDateTime(savedAt) }) : t("notSavedYet")}
					</span>
					<Button onClick={onClose}>{t("close")}</Button>
					<Button
						disabled={!canExport}
						title={canExport ? undefined : t("exportNothing")}
						onClick={() => setExporting(true)}
					>
						{t("exportButton")}
					</Button>
					<Button variant="primary" onClick={() => onSave(plan)}>
						{t("save")}
					</Button>
				</>
			}
		>
			<StaminaCard plan={plan} cans={staminaCansOf(chief)} onChange={setPlan} />
			<PlannedHuntsCard plan={plan} onChange={setPlan} />
			<LeftoverCard plan={plan} onChange={setPlan} />
			<PlanResult plan={plan} result={result} />
			<ExportToEventFlyout
				open={exporting}
				chief={chief}
				spec={exportSpecOf(plan, result)}
				onClose={() => setExporting(false)}
			/>
		</Flyout>
	);
}

interface CardProps {
	plan: BeastPlanDraft;
	onChange: (plan: BeastPlanDraft) => void;
}

const NO_GINA = "none";

function BeastLevelSelect({
	level,
	onChange,
}: {
	level: number;
	onChange: (level: number) => void;
}) {
	const t = useTranslations("coreEvents.beasts");

	return (
		<Select
			value={String(beastLevelBandOf(level).low)}
			onChange={(event) => onChange(Number(event.target.value))}
		>
			{beastLevelBands.map((band) => (
				<option key={band.low} value={band.low}>
					{t("levelGroup", {
						low: formatNumber(band.low),
						high: formatNumber(band.high),
					})}
				</option>
			))}
		</Select>
	);
}

function StaminaCard({ plan, cans, onChange }: CardProps & { cans: number }) {
	const t = useTranslations("coreEvents.beasts.stamina");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<div className="grid grid-cols-2 gap-3">
				<Field label={t("have")}>
					<CountInput
						value={plan.stamina}
						max={MAX_BEAST_COUNT}
						onCommit={(stamina) => onChange({ ...plan, stamina })}
					/>
				</Field>
				<Field
					label={t("cans")}
					hint={t("cansHint", { amount: formatNumber(BEAST_CALCULATOR.staminaPerCan) })}
				>
					<span className="border-line bg-tint flex min-h-11 items-center justify-end gap-2 rounded-md border-[1.5px] px-3 font-mono lg:min-h-9">
						<ItemIcon src={findItem(STAMINA_CAN_ITEM_ID)?.img} size={20} />
						{formatNumber(cans)}
					</span>
				</Field>
			</div>
			<Field label={t("gina")}>
				<Select
					value={
						plan.ginaSkillLevel === undefined ? NO_GINA : String(plan.ginaSkillLevel)
					}
					onChange={(event) =>
						onChange({
							...plan,
							ginaSkillLevel:
								event.target.value === NO_GINA
									? undefined
									: Number(event.target.value),
						})
					}
				>
					<option value={NO_GINA}>{t("ginaNone")}</option>
					{ginaLevelOptions.map((level) => (
						<option key={level} value={level}>
							{t("ginaLevel", {
								level: formatNumber(level),
								percent: formatNumber(staminaReductionOf(level)),
							})}
						</option>
					))}
				</Select>
			</Field>
		</Card>
	);
}

function PlannedHuntsCard({ plan, onChange }: CardProps) {
	const t = useTranslations("coreEvents.beasts.planned");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<p className="text-muted">{t("hint")}</p>
			{plan.beastRuns.length === 0 && <p className="text-muted">{t("empty")}</p>}
			{plan.beastRuns.map((run, index) => (
				<div key={index} className="flex items-end gap-2">
					<div className="flex-1">
						<Field label={t("runLevel")}>
							<BeastLevelSelect
								level={run.level}
								onChange={(level) =>
									onChange(withRunChanged(plan, index, { ...run, level }))
								}
							/>
						</Field>
					</div>
					<div className="flex-1">
						<Field label={t("runCount")}>
							<CountInput
								value={run.count}
								max={MAX_BEAST_COUNT}
								onCommit={(count) =>
									onChange(withRunChanged(plan, index, { ...run, count }))
								}
							/>
						</Field>
					</div>
					<Button
						variant="danger"
						aria-label={t("removeLabel", { level: formatNumber(run.level) })}
						onClick={() => onChange(withRunRemoved(plan, index))}
					>
						{t("remove")}
					</Button>
				</div>
			))}
			<div>
				<Button onClick={() => onChange(withRunAdded(plan))}>
					<LuPlus size={16} aria-hidden="true" />
					{t("add")}
				</Button>
			</div>
			<Field label={t("polarTerrors")}>
				<CountInput
					value={plan.polarTerrors}
					max={MAX_BEAST_COUNT}
					onCommit={(polarTerrors) => onChange({ ...plan, polarTerrors })}
				/>
			</Field>
		</Card>
	);
}

function LeftoverCard({ plan, onChange }: CardProps) {
	const t = useTranslations("coreEvents.beasts.leftover");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<p className="text-muted">{t("hint")}</p>
			<SegmentedControl
				label={t("hunt")}
				options={[
					{ id: "beasts", label: t("beasts") },
					{ id: "polarTerrors", label: t("polarTerrors") },
				]}
				value={plan.leftover}
				onChange={(leftover) => onChange({ ...plan, leftover })}
			/>
			{plan.leftover === "beasts" && (
				<Field label={t("beastLevel")}>
					<BeastLevelSelect
						level={plan.beastLevel}
						onChange={(beastLevel) => onChange({ ...plan, beastLevel })}
					/>
				</Field>
			)}
		</Card>
	);
}

function PlanResult({ plan, result }: { plan: BeastPlanDraft; result: BeastCalculation }) {
	const t = useTranslations("coreEvents.beasts.result");
	const leftoverHunts = plan.leftover === "beasts" ? result.beasts : result.polarTerrors;
	const rows = [
		{ id: "beastCost", value: formatNumber(result.beastStaminaCost) },
		{ id: "polarTerrorCost", value: formatNumber(result.polarTerrorStaminaCost) },
		{ id: "plannedCost", value: formatNumber(result.planned.staminaNeeded) },
		{
			id: "left",
			value: formatNumber(result.planned.staminaLeft - result.planned.staminaShort),
			short: result.planned.staminaShort > 0,
		},
		{
			id: plan.leftover === "beasts" ? "leftoverBeasts" : "leftoverPolarTerrors",
			value: formatNumber(leftoverHunts.count),
		},
	] as const;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<div className="flex flex-col">
				{rows.map((row) => (
					<div
						key={row.id}
						className="border-line flex min-h-9 items-center justify-between gap-2 border-t-[1.5px] py-1 first:border-t-0"
					>
						<span>{t(`rows.${row.id}`)}</span>
						<span
							className={`font-mono ${"short" in row && row.short ? "text-danger" : ""}`}
						>
							{row.value}
						</span>
					</div>
				))}
			</div>
			{result.planned.staminaShort > 0 && (
				<Note>{t("short", { amount: formatNumber(result.planned.staminaShort) })}</Note>
			)}
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("points")}</SectionLabel>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{result.events.map((event) => (
						<div
							key={event.eventId}
							className="border-line flex flex-col rounded-md border-[1.5px] p-2"
						>
							<span className="text-muted text-xs">{event.name}</span>
							<span className="font-mono font-semibold">
								{formatNumber(totalPointsOf(plan, event))}
							</span>
							<span className="text-muted font-mono text-xs">
								{t("plannedPoints", { amount: formatNumber(event.plannedPoints) })}
							</span>
						</div>
					))}
				</div>
				<p className="text-muted text-xs">{t("pointsNote")}</p>
			</div>
		</Card>
	);
}
