"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ReactNode } from "react";
import type { LevelRange } from "@/service/calcHeroUpgrade";
import { withCurrent } from "@/service/calcHeroUpgrade";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";

interface RangeRowProps {
	title: ReactNode;
	levels: number[];
	range: LevelRange;
	labelOf: (level: number) => string;
	onChange: (range: LevelRange) => void;
}

/** The goal offers only levels at or above the current level, so the goal never falls below it. */
export function RangeRow({ title, levels, range, labelOf, onChange }: RangeRowProps) {
	const t = useTranslations("calcHeroUpgrade.range");
	const titleId = useId();
	const goalLevels = levels.filter((level) => level >= range.current);

	return (
		<div
			role="group"
			aria-labelledby={titleId}
			className="border-line grid grid-cols-2 items-end gap-x-3 gap-y-2 border-t-[1.5px] pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]"
		>
			<span
				id={titleId}
				className="col-span-2 flex min-w-0 items-center gap-2 font-medium sm:col-span-1 sm:self-center"
			>
				{title}
			</span>
			<Field label={t("current")}>
				<Select
					value={range.current}
					onChange={(event) => onChange(withCurrent(range, Number(event.target.value)))}
				>
					{levels.map((level) => (
						<option key={level} value={level}>
							{labelOf(level)}
						</option>
					))}
				</Select>
			</Field>
			<Field label={t("goal")}>
				<Select
					value={range.goal}
					onChange={(event) => onChange({ ...range, goal: Number(event.target.value) })}
				>
					{goalLevels.map((level) => (
						<option key={level} value={level}>
							{labelOf(level)}
						</option>
					))}
				</Select>
			</Field>
		</div>
	);
}
