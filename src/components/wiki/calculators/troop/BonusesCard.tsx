"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
	APPOINTMENT_POSITIONS,
	APPOINTMENT_RANKS,
	appointmentEffectOf,
	MAX_COST_REDUCTION_PERCENT,
	MAX_RESEARCH_CAPACITY,
	MAX_TRAINING_SPEED_PERCENT,
} from "@/service/calcTroop";
import type {
	AppointmentPosition,
	AppointmentRank,
	TroopCalculatorState,
} from "@/service/calcTroop";
import { TROOP_CALCULATOR, TROOP_TYPES } from "@/data/game/calcTroop";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { SwitchRow } from "@/comps/ui/Switch";
import { useGameLabels } from "../../useGameLabels";
import { PercentInput } from "./PercentInput";

interface BonusesCardProps {
	state: TroopCalculatorState;
	onChange: (state: TroopCalculatorState) => void;
}

export function BonusesCard({ state, onChange }: BonusesCardProps) {
	const t = useTranslations("calcTroop.bonuses");
	const labels = useGameLabels();
	const effect = appointmentEffectOf(state.position, state.rank);
	const speedEffect = (speed: number) => t("speedEffect", { speed: formatNumber(speed) });

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h2 className="text-lg font-semibold">{t("title")}</h2>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label={t("researchCapacity")} hint={t("researchCapacityHint")}>
					<CountInput
						value={state.researchCapacity}
						max={MAX_RESEARCH_CAPACITY}
						onCommit={(researchCapacity) => onChange({ ...state, researchCapacity })}
					/>
				</Field>
				<Field label={t("trainingSpeed")} hint={t("trainingSpeedHint")}>
					<PercentInput
						value={state.trainingSpeedPercent}
						max={MAX_TRAINING_SPEED_PERCENT}
						onCommit={(trainingSpeedPercent) =>
							onChange({ ...state, trainingSpeedPercent })
						}
					/>
				</Field>
				<Field label={t("position")}>
					<Select
						value={state.position}
						onChange={(event) =>
							onChange({
								...state,
								position: event.target.value as AppointmentPosition,
							})
						}
					>
						{APPOINTMENT_POSITIONS.map((id) => (
							<option key={id} value={id}>
								{t(`positions.${id}`)}
							</option>
						))}
					</Select>
				</Field>
				<Field
					label={t("rank")}
					hint={t("appointmentEffect", {
						capacity: formatNumber(effect.capacity),
						speed: formatNumber(effect.speedPercent),
					})}
				>
					<Select
						value={state.rank}
						disabled={state.position === "none"}
						onChange={(event) =>
							onChange({ ...state, rank: event.target.value as AppointmentRank })
						}
					>
						{APPOINTMENT_RANKS.map((id) => (
							<option key={id} value={id}>
								{t(`ranks.${id}`)}
							</option>
						))}
					</Select>
				</Field>
			</div>
			<div className="border-line flex flex-col border-t-[1.5px]">
				<SwitchRow
					label={t("capacityBoost")}
					description={t("capacityBoostEffect", {
						multiplier: formatNumber(TROOP_CALCULATOR.capacityBoostMultiplier),
					})}
					checked={state.capacityBoost}
					onChange={(capacityBoost) => onChange({ ...state, capacityBoost })}
				/>
				<SwitchRow
					label={t("mobilize")}
					description={speedEffect(TROOP_CALCULATOR.mobilizeSpeedPercent)}
					checked={state.mobilize}
					onChange={(mobilize) => onChange({ ...state, mobilize })}
				/>
				<SwitchRow
					label={t("advancedTraining")}
					description={speedEffect(TROOP_CALCULATOR.advancedTrainingSpeedPercent)}
					checked={state.advancedTraining}
					onChange={(advancedTraining) => onChange({ ...state, advancedTraining })}
				/>
			</div>
			<div className="border-line flex flex-col gap-3 border-t-[1.5px] pt-4">
				<SectionLabel className="text-muted">{t("costReduction")}</SectionLabel>
				<div className="grid gap-4 sm:grid-cols-3">
					{TROOP_TYPES.map((type) => (
						<Field
							key={type}
							label={t("costReductionLabel", { name: labels.troopId(type) })}
							hint={t("costReductionHint", {
								max: formatDecimal(MAX_COST_REDUCTION_PERCENT),
							})}
						>
							<PercentInput
								value={state.costReductionPercent[type]}
								max={MAX_COST_REDUCTION_PERCENT}
								onCommit={(percent) =>
									onChange({
										...state,
										costReductionPercent: {
											...state.costReductionPercent,
											[type]: percent,
										},
									})
								}
							/>
						</Field>
					))}
				</div>
			</div>
		</Card>
	);
}
