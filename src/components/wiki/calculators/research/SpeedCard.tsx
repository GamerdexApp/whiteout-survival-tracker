"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import { MAX_SPEED_PERCENT } from "@/service/calcResearch";
import type { ResearchCalculatorInputs } from "@/service/calcResearch";
import type { VicePresident } from "@/data/game/calcResearch";
import { STATE_BUFF_PERCENT, VICE_PRESIDENT_PERCENT } from "@/data/game/calcResearch";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Switch } from "@/comps/ui/Switch";
import { PercentInput } from "./PercentInput";

const VICE_PRESIDENT_IDS: VicePresident[] = ["none", "regular", "supreme"];

interface SpeedCardProps {
	inputs: ResearchCalculatorInputs;
	totalSpeedPercent: number;
	onChange: (inputs: ResearchCalculatorInputs) => void;
	onReset: () => void;
}

export function SpeedCard({ inputs, totalSpeedPercent, onChange, onReset }: SpeedCardProps) {
	const t = useTranslations("calcResearch.speed");
	const stateBuffLabelId = useId();
	const vicePresidentOptions = VICE_PRESIDENT_IDS.map((id) => ({
		id,
		label: t(`vicePresident.${id}`),
	}));

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
				<Button onClick={onReset}>{t("reset")}</Button>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
				<Field label={t("percentLabel")} hint={t("percentHint")}>
					<PercentInput
						value={inputs.speedPercent}
						max={MAX_SPEED_PERCENT}
						onCommit={(speedPercent) => onChange({ ...inputs, speedPercent })}
					/>
				</Field>
				<div className="flex flex-col gap-1.5">
					<span id={stateBuffLabelId} className="font-medium">
						{t("stateBuff")}
					</span>
					<span className="flex min-h-11 items-center gap-3 lg:min-h-9">
						<Switch
							labelledBy={stateBuffLabelId}
							checked={inputs.stateBuff}
							onChange={(stateBuff) => onChange({ ...inputs, stateBuff })}
						/>
						<span className="font-mono text-xs">
							{t("percentPlus", { value: formatNumber(STATE_BUFF_PERCENT) })}
						</span>
					</span>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="font-medium" aria-hidden="true">
						{t("vicePresident.label")}
					</span>
					<span className="flex flex-wrap items-center gap-3">
						<SegmentedControl
							label={t("vicePresident.label")}
							options={vicePresidentOptions}
							value={inputs.vicePresident}
							onChange={(vicePresident) => onChange({ ...inputs, vicePresident })}
						/>
						<span className="font-mono text-xs">
							{t("percentPlus", {
								value: formatNumber(VICE_PRESIDENT_PERCENT[inputs.vicePresident]),
							})}
						</span>
					</span>
				</div>
			</div>
			<div className="border-line flex items-center justify-between gap-3 border-t-[1.5px] pt-3">
				<span className="font-semibold">{t("total")}</span>
				<span className="text-primary font-mono font-semibold">
					{t("percent", { value: formatDecimal(totalSpeedPercent) })}
				</span>
			</div>
		</Card>
	);
}
