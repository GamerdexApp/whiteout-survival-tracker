"use client";

import { useTranslations } from "next-intl";
import type { CharmChoice } from "@/service/calcChiefCharm";
import { goalLevelsFrom, withStartLevel } from "@/service/calcChiefCharm";
import { charmLevelList } from "@/data/game/calcChiefCharm";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";

const NONE = "";

const levelIdOf = (value: string) => (value === NONE ? null : value);

interface CharmRangeFieldsProps {
	choice: CharmChoice;
	fromLabel: string;
	toLabel: string;
	/** Screen reader names that say which charm the fields belong to. */
	fromName?: string;
	toName?: string;
	onChange: (choice: CharmChoice) => void;
}

export function CharmRangeFields({
	choice,
	fromLabel,
	toLabel,
	fromName,
	toName,
	onChange,
}: CharmRangeFieldsProps) {
	const t = useTranslations("calcChiefCharm.fields");

	return (
		<>
			<Field label={fromLabel}>
				<Select
					aria-label={fromName}
					value={choice.from ?? NONE}
					onChange={(event) =>
						onChange(withStartLevel(choice, levelIdOf(event.target.value)))
					}
				>
					<option value={NONE}>{t("notStarted")}</option>
					{charmLevelList.map((level) => (
						<option key={level.id} value={level.id}>
							{level.name}
						</option>
					))}
				</Select>
			</Field>
			<Field label={toLabel}>
				<Select
					aria-label={toName}
					value={choice.to ?? NONE}
					onChange={(event) => onChange({ ...choice, to: levelIdOf(event.target.value) })}
				>
					<option value={NONE}>{t("skip")}</option>
					{goalLevelsFrom(choice.from).map((level) => (
						<option key={level.id} value={level.id}>
							{level.name}
						</option>
					))}
				</Select>
			</Field>
		</>
	);
}
