"use client";

import { useTranslations } from "next-intl";
import { LuMinus, LuPlus } from "react-icons/lu";
import { IconButton } from "./IconButton";

export interface StepperStop {
	value: string;
	label: string;
}

interface LevelStepperProps {
	label: string;
	stops: StepperStop[];
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	limitValue?: string;
	wide?: boolean;
}

/**
 * Moves one stop at a time with the buttons. The list in the middle jumps to any stop, which
 * matters when a building has 80 levels. Stops follow the order they are given, never arithmetic.
 * Stops after `limitValue` cannot be picked, which keeps a level out of reach until its
 * requirements are met. Lowering is always allowed.
 */
export function LevelStepper({
	label,
	stops,
	value,
	onChange,
	disabled = false,
	limitValue,
	wide = false,
}: LevelStepperProps) {
	const t = useTranslations("ui.stepper");
	const index = stops.findIndex((stop) => stop.value === value);
	const stepTo = (target: number) => onChange(stops[target].value);
	const limitIndex =
		limitValue === undefined
			? stops.length - 1
			: stops.findIndex((stop) => stop.value === limitValue);

	return (
		<div className="inline-flex items-center gap-1">
			<IconButton
				label={t("lower", { label })}
				disabled={disabled || index <= 0}
				onClick={() => stepTo(index - 1)}
				className="border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40"
			>
				<LuMinus size={16} aria-hidden="true" />
			</IconButton>
			<select
				aria-label={label}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className={`text-ink hover:border-line min-h-11 ${wide ? "w-60" : "w-24"} appearance-none rounded-md border-[1.5px] border-transparent bg-transparent px-1 text-center font-mono font-medium disabled:opacity-60 lg:min-h-9`}
			>
				{stops.map((stop, position) => (
					<option key={stop.value} value={stop.value} disabled={position > limitIndex}>
						{stop.label}
					</option>
				))}
			</select>
			<IconButton
				label={t("raise", { label })}
				disabled={disabled || index >= limitIndex}
				onClick={() => stepTo(index + 1)}
				className="border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40"
			>
				<LuPlus size={16} aria-hidden="true" />
			</IconButton>
		</div>
	);
}
