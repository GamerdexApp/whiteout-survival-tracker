"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { Playthrough, TroopId, TroopRunMode, TroopRunState } from "@/types/app";
import { formatDecimal, formatDuration, formatNumber } from "@/lib/format";
import { TROOP_IDS } from "@/service/troops";
import {
	newRun,
	tierNumbers,
	withPromotionFrom,
	withPromotionTo,
	withRunMode,
} from "@/service/troopsPlan";
import type { TroopPosition, TroopsPlanDraft, TroopsPlanResult } from "@/service/troopsPlan";
import { allTroops, MAX_TIER, TROOP_CALCULATOR } from "@/data/game/troops";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import { CountInput } from "./CountInput";
import { TroopSegmented } from "./TroopSegmented";

const RUN_MODES: TroopRunMode[] = ["training", "promotion"];
const MAX_BATCHES = 999;
const MAX_RUN_TROOPS = 999_999_999;

const troopNameOf = (id: TroopId) => allTroops.find((troop) => troop.id === id)?.name ?? id;

function TierSelect({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (tier: number) => void;
}) {
	const t = useTranslations("troops.plan.run");

	return (
		<Select
			aria-label={label}
			value={value}
			onChange={(event) => onChange(Number(event.target.value))}
		>
			{tierNumbers.map((tier) => (
				<option key={tier} value={tier}>
					{t("tier", { tier: formatNumber(tier) })}
				</option>
			))}
		</Select>
	);
}

export function AddTroop({
	chief,
	onAdd,
}: {
	chief: Playthrough;
	onAdd: (run: TroopRunState) => void;
}) {
	const t = useTranslations("troops.plan.add");
	const tr = useTranslations("troops.plan.run");
	const [camp, setCamp] = useState<TroopId>("infantry");
	const [mode, setMode] = useState<TroopRunMode>("training");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<div className="flex flex-col gap-3 sm:flex-row">
				<div className="flex flex-1 gap-3">
					<div className="flex-1">
						<Select
							aria-label={t("typeLabel")}
							value={camp}
							onChange={(event) => setCamp(event.target.value as TroopId)}
						>
							{TROOP_IDS.map((id) => (
								<option key={id} value={id}>
									{troopNameOf(id)}
								</option>
							))}
						</Select>
					</div>
					<div className="flex-1">
						<Select
							aria-label={t("modeLabel")}
							value={mode}
							onChange={(event) => setMode(event.target.value as TroopRunMode)}
						>
							{RUN_MODES.map((id) => (
								<option key={id} value={id}>
									{tr(`modes.${id}`)}
								</option>
							))}
						</Select>
					</div>
				</div>
				<Button variant="primary" onClick={() => onAdd(newRun(chief, camp, mode))}>
					<LuPlus size={16} aria-hidden="true" />
					{t("button")}
				</Button>
			</div>
		</Card>
	);
}

export function RunCard({
	chief,
	run,
	seconds,
	capacity,
	onChange,
	onRemove,
}: {
	chief: Playthrough;
	run: TroopRunState;
	seconds: number;
	capacity: number;
	onChange: (run: TroopRunState) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("troops.plan.run");
	const name = troopNameOf(run.camp);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">{name}</h3>
				<div className="flex items-center gap-3">
					<span className="text-muted font-mono text-xs">{formatDuration(seconds)}</span>
					<Button variant="danger" aria-label={t("remove", { name })} onClick={onRemove}>
						{t("removeButton")}
					</Button>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-36 flex-1">
					<Select
						aria-label={t("modeLabel", { name })}
						value={run.mode}
						onChange={(event) =>
							onChange(withRunMode(chief, run, event.target.value as TroopRunMode))
						}
					>
						{RUN_MODES.map((id) => (
							<option key={id} value={id}>
								{t(`modes.${id}`)}
							</option>
						))}
					</Select>
				</div>
				{run.mode === "training" ? (
					<div className="min-w-36 flex-1">
						<TierSelect
							label={t("tierLabel", { name })}
							value={run.tier ?? 1}
							onChange={(tier) => onChange({ ...run, tier })}
						/>
					</div>
				) : (
					<>
						<div className="min-w-28 flex-1">
							<TierSelect
								label={t("fromLabel", { name })}
								value={run.fromTier ?? 1}
								onChange={(tier) =>
									onChange(withPromotionFrom(run, Math.min(tier, MAX_TIER - 1)))
								}
							/>
						</div>
						<span className="text-muted">{t("to")}</span>
						<div className="min-w-28 flex-1">
							<TierSelect
								label={t("toLabel", { name })}
								value={run.toTier ?? 2}
								onChange={(tier) =>
									onChange(withPromotionTo(run, Math.max(tier, 2)))
								}
							/>
						</div>
					</>
				)}
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<Field
					label={t("troops")}
					labelAction={
						<button
							type="button"
							className="text-link min-h-11 px-2 font-medium underline lg:min-h-0"
							onClick={() => onChange({ ...run, count: "max" })}
						>
							{t("max")}
						</button>
					}
				>
					<CountInput
						value={run.count === "max" ? null : run.count}
						max={MAX_RUN_TROOPS}
						emptyText={t("maxValue", { capacity: formatNumber(capacity) })}
						onCommit={(count) => onChange({ ...run, count })}
					/>
				</Field>
				<Field label={t("batches")}>
					<CountInput
						value={run.batches}
						min={1}
						max={MAX_BATCHES}
						onCommit={(batches) => onChange({ ...run, batches })}
					/>
				</Field>
			</div>
		</Card>
	);
}

const MINISTER = TROOP_CALCULATOR.ministerOfEducation;

const POSITIONS: TroopPosition[] = ["none", "ministerOfEducation", "vicePresident"];

function Row({
	label,
	children,
	emphasis = false,
}: {
	label: string;
	children: React.ReactNode;
	emphasis?: boolean;
}) {
	return (
		<div className="border-line flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0">
			<span className={emphasis ? "font-semibold" : "font-medium"}>{label}</span>
			<span className="flex items-center gap-2">{children}</span>
		</div>
	);
}

export function CapacityAndSpeed({
	draft,
	result,
	onDraftChange,
}: {
	draft: TroopsPlanDraft;
	result: TroopsPlanResult;
	onDraftChange: (draft: TroopsPlanDraft) => void;
}) {
	const t = useTranslations("troops.plan.speed");
	const { bonuses, appointment, calculation } = result;
	const percent = (value: number) => t("percent", { value: formatDecimal(value) });
	const readOnly = <Badge tone="added">{t("readOnly")}</Badge>;

	return (
		<>
			<p className="text-muted">
				{t("readOnlyNote")}{" "}
				<Link href="/bonuses" className="text-link underline">
					{t("openBonuses")}
				</Link>
			</p>
			<h3 className="font-semibold">{t("title")}</h3>
			<Card className="flex flex-col gap-2 p-4">
				<SectionLabel className="text-muted">{t("appointment")}</SectionLabel>
				<div className="flex flex-col gap-2">
					<TroopSegmented
						label={t("position")}
						options={POSITIONS.map((id) => ({ id, label: t(`positions.${id}`) }))}
						value={draft.position}
						onChange={(position) => onDraftChange({ ...draft, position })}
					/>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<TroopSegmented
							label={t("rank")}
							options={[
								{ id: "regular", label: t("ranks.regular") },
								{ id: "supreme", label: t("ranks.supreme") },
							]}
							value={draft.rank}
							disabled={draft.position === "none"}
							onChange={(rank) => onDraftChange({ ...draft, rank })}
						/>
						<span className="font-mono text-xs">
							{t("appointmentEffect", {
								capacity: formatNumber(appointment.capacity),
								speed: formatNumber(appointment.speedPercent),
							})}
						</span>
					</div>
					<p className="text-muted text-xs">
						{t("appointmentNote", {
							moeCapacity: formatNumber(MINISTER.capacity.regular),
							moeSpeed: formatNumber(MINISTER.speedPercent.regular),
							moeCapacitySupreme: formatNumber(MINISTER.capacity.supreme),
							moeSpeedSupreme: formatNumber(MINISTER.speedPercent.supreme),
							vpSpeed: formatNumber(
								TROOP_CALCULATOR.vicePresidentSpeedPercent.regular
							),
							vpSpeedSupreme: formatNumber(
								TROOP_CALCULATOR.vicePresidentSpeedPercent.supreme
							),
						})}
					</p>
				</div>
				<SectionLabel className="text-muted mt-2">{t("capacity")}</SectionLabel>
				<div className="flex flex-col">
					<Row label={t("researchCapacity")}>
						<span className="font-mono font-semibold">
							{t("troops", { value: formatNumber(bonuses.capacity) })}
						</span>
						{readOnly}
					</Row>
					<Row label={t("capacityBoost")}>
						<span className="text-muted font-mono text-xs">
							{t("boostTotal", {
								multiplier: formatNumber(TROOP_CALCULATOR.capacityBoostMultiplier),
							})}
						</span>
						<Switch
							label={t("capacityBoost")}
							checked={draft.capacityBoost}
							onChange={(capacityBoost) => onDraftChange({ ...draft, capacityBoost })}
						/>
					</Row>
					<Row label={t("capacityPerBatch")} emphasis>
						<span className="text-primary font-mono font-semibold">
							{formatNumber(calculation.capacity)}
						</span>
					</Row>
				</div>
				<SectionLabel className="text-muted mt-2">{t("trainingSpeed")}</SectionLabel>
				<div className="flex flex-col">
					<Row label={t("gameSpeed")}>
						<span className="font-mono font-semibold">
							{percent(bonuses.speedPercent)}
						</span>
						{readOnly}
					</Row>
					<Row label={t("appointmentSpeed")}>
						<span className="font-mono text-xs">
							{t("percentPlus", { value: formatNumber(appointment.speedPercent) })}
						</span>
					</Row>
					<Row label={t("mobilize")}>
						<span className="font-mono text-xs">
							{t("percentPlus", {
								value: formatNumber(TROOP_CALCULATOR.mobilizeSpeedPercent),
							})}
						</span>
						<Switch
							label={t("mobilize")}
							checked={draft.mobilize}
							onChange={(mobilize) => onDraftChange({ ...draft, mobilize })}
						/>
					</Row>
					<Row label={t("advancedTraining")}>
						<span className="font-mono text-xs">
							{t("percentPlus", {
								value: formatNumber(TROOP_CALCULATOR.advancedTrainingSpeedPercent),
							})}
						</span>
						<Switch
							label={t("advancedTraining")}
							checked={draft.advancedTraining}
							onChange={(advancedTraining) =>
								onDraftChange({ ...draft, advancedTraining })
							}
						/>
					</Row>
					<Row label={t("speedUsed")} emphasis>
						<span className="text-primary font-mono font-semibold">
							{percent(calculation.trainingSpeedPercent)}
						</span>
					</Row>
				</div>
			</Card>
		</>
	);
}
