"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";
import { IconButton } from "@/comps/ui/IconButton";

interface PetNumberFieldProps {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	display: (value: number) => string;
	onChange: (value: number) => void;
	allowDecimals?: boolean;
	suffix?: string;
	disabled?: boolean;
}

const BUTTON_CLASSES = "border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40";
const ROUNDING = 100;

const parseDraft = (text: string) => Number(text.replace(",", "."));

/**
 * A minus button, a typed value and a plus button. The text stays as typed while the field has
 * focus and takes its shown form on blur.
 */
export function PetNumberField({
	label,
	value,
	min,
	max,
	step,
	display,
	onChange,
	allowDecimals = false,
	suffix,
	disabled = false,
}: PetNumberFieldProps) {
	const t = useTranslations("ui.stepper");
	const [draft, setDraft] = useState<string | null>(null);

	const clamp = (next: number) => Math.min(max, Math.max(min, next));
	const move = (direction: 1 | -1) =>
		onChange(clamp(Math.round((value + direction * step) * ROUNDING) / ROUNDING));

	const type = (text: string) => {
		const cleaned = text.replace(allowDecimals ? /[^\d.,]/g : /\D/g, "");
		setDraft(cleaned);
		const parsed = parseDraft(cleaned);
		if (cleaned !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
			onChange(parsed);
		}
	};

	const settle = () => {
		if (draft === null) return;
		const parsed = parseDraft(draft);
		if (draft !== "" && Number.isFinite(parsed)) onChange(clamp(parsed));
		setDraft(null);
	};

	return (
		<span className="flex min-w-0 flex-1 items-center gap-1">
			<IconButton
				label={t("lower", { label })}
				disabled={disabled || value <= min}
				onClick={() => move(-1)}
				className={BUTTON_CLASSES}
			>
				<LuMinus size={16} aria-hidden="true" />
			</IconButton>
			<span className="border-line bg-surface focus-within:border-primary flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md border-[1.5px] lg:min-h-9">
				<input
					inputMode={allowDecimals ? "decimal" : "numeric"}
					aria-label={label}
					disabled={disabled}
					value={draft ?? display(value)}
					onChange={(event) => type(event.target.value)}
					onBlur={settle}
					onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
					className="text-ink min-w-0 flex-1 self-stretch bg-transparent px-1 text-center font-mono font-medium outline-none disabled:opacity-60"
				/>
				{suffix && <span className="text-muted pe-2 font-mono text-xs">{suffix}</span>}
			</span>
			<IconButton
				label={t("raise", { label })}
				disabled={disabled || value >= max}
				onClick={() => move(1)}
				className={BUTTON_CLASSES}
			>
				<LuPlus size={16} aria-hidden="true" />
			</IconButton>
		</span>
	);
}
