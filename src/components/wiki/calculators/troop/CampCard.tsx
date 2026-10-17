"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import {
	CAMP_MODES,
	campLevelOptions,
	countWithin,
	MAX_BATCHES,
	promotionFromTiers,
	promotionToTiers,
	runKindsOf,
	trainingTiers,
	withPromotionFrom,
} from "@/service/calcTroop";
import type { CampInput, CampMode, RunCount, RunKind } from "@/service/calcTroop";
import type { TroopCampResult, TroopType } from "@/data/game/calcTroop";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { useGameLabels } from "../../useGameLabels";

interface CampCardProps {
	type: TroopType;
	camp: CampInput;
	capacity: number;
	result: TroopCampResult;
	onChange: (camp: CampInput) => void;
}

export function CampCard({ type, camp, capacity, result, onChange }: CampCardProps) {
	const t = useTranslations("calcTroop.camps");
	const labels = useGameLabels();
	const kinds = runKindsOf(camp.mode);

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{labels.troopId(type)}</h3>
				{kinds.length > 0 && (
					<span className="text-muted font-mono text-xs">
						{formatDuration(result.seconds)}
					</span>
				)}
			</div>
			<Field label={t("level")}>
				<Select
					value={camp.level}
					onChange={(event) => onChange({ ...camp, level: event.target.value })}
				>
					{campLevelOptions[type].map((level) => (
						<option key={level.label} value={level.label}>
							{t("levelOption", {
								level: level.label,
								capacity: formatNumber(level.capacity),
							})}
						</option>
					))}
				</Select>
			</Field>
			<Field label={t("mode")}>
				<Select
					value={camp.mode}
					onChange={(event) =>
						onChange({ ...camp, mode: event.target.value as CampMode })
					}
				>
					{CAMP_MODES.map((mode) => (
						<option key={mode} value={mode}>
							{t(`modes.${mode}`)}
						</option>
					))}
				</Select>
			</Field>
			{kinds.map((kind, index) => (
				<RunFields
					key={kind}
					kind={kind}
					camp={camp}
					capacity={capacity}
					seconds={result.runs[index].seconds}
					onChange={onChange}
				/>
			))}
		</Card>
	);
}

interface RunFieldsProps {
	kind: RunKind;
	camp: CampInput;
	capacity: number;
	seconds: number;
	onChange: (camp: CampInput) => void;
}

function RunFields({ kind, camp, capacity, seconds, onChange }: RunFieldsProps) {
	const t = useTranslations("calcTroop.camps");
	const tRoot = useTranslations("calcTroop");
	const tierText = (tier: number) => tRoot("tier", { tier: formatNumber(tier) });
	const run = kind === "training" ? camp.training : camp.promotion;
	const count = countWithin(run.count, capacity);
	const setCount = (next: RunCount) =>
		onChange(
			kind === "training"
				? { ...camp, training: { ...camp.training, count: next } }
				: { ...camp, promotion: { ...camp.promotion, count: next } }
		);
	const setBatches = (batches: number) =>
		onChange(
			kind === "training"
				? { ...camp, training: { ...camp.training, batches } }
				: { ...camp, promotion: { ...camp.promotion, batches } }
		);

	return (
		<div className="border-line flex flex-col gap-3 border-t-[1.5px] pt-4">
			<div className="flex items-baseline justify-between gap-3">
				<SectionLabel className="text-muted">
					{kind === "training" ? t("trainingTitle") : t("promotionTitle")}
				</SectionLabel>
				<span className="text-muted font-mono text-xs">
					{t("runTime", { time: formatDuration(seconds) })}
				</span>
			</div>
			{kind === "training" ? (
				<Field label={t("trainTier")}>
					<Select
						value={camp.training.tier}
						onChange={(event) =>
							onChange({
								...camp,
								training: { ...camp.training, tier: Number(event.target.value) },
							})
						}
					>
						{trainingTiers.map((tier) => (
							<option key={tier} value={tier}>
								{tierText(tier)}
							</option>
						))}
					</Select>
				</Field>
			) : (
				<div className="grid grid-cols-2 gap-3">
					<Field label={t("fromTier")}>
						<Select
							value={camp.promotion.fromTier}
							onChange={(event) =>
								onChange({
									...camp,
									promotion: withPromotionFrom(
										camp.promotion,
										Number(event.target.value)
									),
								})
							}
						>
							{promotionFromTiers.map((tier) => (
								<option key={tier} value={tier}>
									{tierText(tier)}
								</option>
							))}
						</Select>
					</Field>
					<Field label={t("toTier")}>
						<Select
							value={camp.promotion.toTier}
							onChange={(event) =>
								onChange({
									...camp,
									promotion: {
										...camp.promotion,
										toTier: Number(event.target.value),
									},
								})
							}
						>
							{promotionToTiers(camp.promotion.fromTier).map((tier) => (
								<option key={tier} value={tier}>
									{tierText(tier)}
								</option>
							))}
						</Select>
					</Field>
				</div>
			)}
			<div className="grid grid-cols-2 gap-3">
				<Field
					label={t("troopsPerBatch")}
					labelAction={
						<button
							type="button"
							className="text-link ms-auto min-h-11 px-2 font-medium underline lg:min-h-0"
							onClick={() => setCount("max")}
						>
							{t("max")}
						</button>
					}
				>
					<CountInput
						value={count === "max" ? null : count}
						max={capacity}
						emptyText={t("maxValue", { capacity: formatNumber(capacity) })}
						onCommit={setCount}
					/>
				</Field>
				<Field label={t("batches")}>
					<CountInput
						value={run.batches}
						min={1}
						max={MAX_BATCHES}
						onCommit={setBatches}
					/>
				</Field>
			</div>
		</div>
	);
}
