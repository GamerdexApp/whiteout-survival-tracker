"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { ginaLevelOptions, MAX_BEAST_COUNT } from "@/service/calcBeast";
import type { BeastCalculatorInputs } from "@/service/calcBeast";
import { BEAST_CALCULATOR, STAMINA_CAN_ITEM_ID, staminaReductionOf } from "@/data/game/calcBeast";
import { findItem } from "@/data/game/items";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { BeastLevelSelect } from "./BeastLevelSelect";

interface StaminaCardProps {
	inputs: BeastCalculatorInputs;
	onChange: (inputs: BeastCalculatorInputs) => void;
}

const NO_GINA = "none";

export function StaminaCard({ inputs, onChange }: StaminaCardProps) {
	const t = useTranslations("calcBeast.stamina");

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="grid grid-cols-2 gap-3">
				<Field label={t("stamina")}>
					<CountInput
						value={inputs.stamina}
						max={MAX_BEAST_COUNT}
						onCommit={(stamina) => onChange({ ...inputs, stamina })}
					/>
				</Field>
				<Field
					label={t("cans")}
					labelAction={<ItemIcon src={findItem(STAMINA_CAN_ITEM_ID)?.img} size={20} />}
					hint={t("cansHint", { amount: formatNumber(BEAST_CALCULATOR.staminaPerCan) })}
				>
					<CountInput
						value={inputs.staminaCans}
						max={MAX_BEAST_COUNT}
						onCommit={(staminaCans) => onChange({ ...inputs, staminaCans })}
					/>
				</Field>
			</div>
			<Field label={t("gina")}>
				<Select
					value={
						inputs.ginaSkillLevel === undefined
							? NO_GINA
							: String(inputs.ginaSkillLevel)
					}
					onChange={(event) =>
						onChange({
							...inputs,
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
			<Field label={t("beastLevel")} hint={t("beastLevelHint")}>
				<BeastLevelSelect
					level={inputs.beastLevel}
					onChange={(beastLevel) => onChange({ ...inputs, beastLevel })}
				/>
			</Field>
		</Card>
	);
}
