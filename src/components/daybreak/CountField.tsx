"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { IconButton } from "@/comps/ui/IconButton";

interface CountFieldProps {
	label: string;
	value: number;
	min: number;
	max: number;
	disabled?: boolean;
	onChange: (value: number) => void;
}

const BUTTON_CLASSES = "border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40";

/**
 * A minus button, a typed count and a plus button. The text stays as typed while the field has
 * focus and takes its shown form on blur.
 */
export function CountField({
	label,
	value,
	min,
	max,
	disabled = false,
	onChange,
}: CountFieldProps) {
	const t = useTranslations("ui.stepper");
	const [draft, setDraft] = useState<string | null>(null);

	const clamp = (next: number) => Math.min(max, Math.max(min, next));

	const type = (text: string) => {
		const cleaned = text.replace(/\D/g, "");
		setDraft(cleaned);
		const parsed = Number(cleaned);
		if (cleaned !== "" && parsed >= min && parsed <= max) onChange(parsed);
	};

	const settle = () => {
		if (draft === null) return;
		if (draft !== "") onChange(clamp(Number(draft)));
		setDraft(null);
	};

	return (
		<span className="flex items-center gap-1">
			<IconButton
				label={t("lower", { label })}
				disabled={disabled || value <= min}
				onClick={() => onChange(clamp(value - 1))}
				className={BUTTON_CLASSES}
			>
				<LuMinus size={16} aria-hidden="true" />
			</IconButton>
			<input
				inputMode="numeric"
				aria-label={label}
				disabled={disabled}
				value={draft ?? formatNumber(value)}
				onChange={(event) => type(event.target.value)}
				onBlur={settle}
				onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
				className="border-line bg-surface text-ink focus:border-primary min-h-11 w-16 rounded-md border-[1.5px] px-1 text-center font-mono font-medium outline-none disabled:opacity-60 lg:min-h-9"
			/>
			<IconButton
				label={t("raise", { label })}
				disabled={disabled || value >= max}
				onClick={() => onChange(clamp(value + 1))}
				className={BUTTON_CLASSES}
			>
				<LuPlus size={16} aria-hidden="true" />
			</IconButton>
		</span>
	);
}
