"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { formatNumber } from "@/lib/format";

interface LevelPickerProps {
	name: string;
	level: number;
	knownLevels: number;
	onChange: (level: number) => void;
}

export function LevelPicker({ name, level, knownLevels, onChange }: LevelPickerProps) {
	const t = useTranslations("dailies.missions");
	const group = useId();
	const levels = Array.from({ length: knownLevels + 1 }, (_, level) => level);

	return (
		<fieldset className="border-line inline-flex overflow-hidden rounded-md border-[1.5px]">
			<legend className="sr-only">{t("picker", { name })}</legend>
			{levels.map((option) => (
				<label
					key={option}
					className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-3 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-(--ring) lg:min-h-9 lg:min-w-9 ${option === level ? "bg-primary text-on-primary" : "bg-surface"}`}
				>
					<input
						type="radio"
						name={group}
						checked={option === level}
						onChange={() => onChange(option)}
						className="sr-only"
					/>
					{option === 0 ? t("none") : formatNumber(option)}
				</label>
			))}
		</fieldset>
	);
}
