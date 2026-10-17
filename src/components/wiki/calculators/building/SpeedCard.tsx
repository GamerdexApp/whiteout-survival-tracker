"use client";

import { useTranslations } from "next-intl";
import type { Appointment } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
	APPOINTMENT_PERCENT,
	DOUBLE_TIME_PERCENT,
	MAX_SPEED_PERCENT,
	MAX_SPEEDUP_MINUTES,
	totalSpeedPercent,
} from "@/service/calcBuilding";
import type { BuildingCalculatorInputs } from "@/service/calcBuilding";
import { CountInput } from "@/comps/troops/CountInput";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { SwitchRow } from "@/comps/ui/Switch";
import { PercentInput } from "./PercentInput";

const APPOINTMENT_IDS: Appointment[] = ["none", "regular", "supreme"];

interface SpeedCardProps {
	inputs: BuildingCalculatorInputs;
	onChange: (inputs: BuildingCalculatorInputs) => void;
	onReset: () => void;
}

export function SpeedCard({ inputs, onChange, onReset }: SpeedCardProps) {
	const t = useTranslations("calcBuilding.speed");
	const plusPercent = (value: number) => t("percentPlus", { value: formatNumber(value) });
	const vicePresidentOptions = APPOINTMENT_IDS.map((id) => ({
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
							{plusPercent(APPOINTMENT_PERCENT[inputs.vicePresident])}
						</span>
					</span>
				</div>
				<Field label={t("speedupLabel")} hint={t("speedupHint")}>
					<CountInput
						value={inputs.speedupMinutes}
						max={MAX_SPEEDUP_MINUTES}
						onCommit={(speedupMinutes) => onChange({ ...inputs, speedupMinutes })}
					/>
				</Field>
			</div>
			<div className="border-line border-t-[1.5px]">
				<SwitchRow
					label={t("doubleTime")}
					description={t("doubleTimeNote", { value: formatNumber(DOUBLE_TIME_PERCENT) })}
					checked={inputs.doubleTime}
					onChange={(doubleTime) => onChange({ ...inputs, doubleTime })}
				/>
			</div>
			<div className="border-line flex items-center justify-between gap-3 border-t-[1.5px] pt-3">
				<span className="font-semibold">{t("total")}</span>
				<span className="text-primary font-mono font-semibold">
					{t("percent", { value: formatDecimal(totalSpeedPercent(inputs)) })}
				</span>
			</div>
		</Card>
	);
}
