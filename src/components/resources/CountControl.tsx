"use client";

import { useTranslations } from "next-intl";
import { LuMinus, LuPlus } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { MAX_COUNT } from "@/service/inventory";
import { IconButton } from "@/comps/ui/IconButton";

interface CountInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	className?: string;
}

/**
 * Always shows the count with thousands separators. Typing keeps only the digits and passes the
 * number on at once. The text does not change shape on focus, so a click selects the whole number
 * and the next digits replace it.
 */
export function CountInput({ label, value, onChange, className = "" }: CountInputProps) {
	return (
		<input
			type="text"
			inputMode="numeric"
			aria-label={label}
			value={formatNumber(value)}
			onFocus={(event) => event.target.select()}
			onChange={(event) => {
				const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
				onChange(Math.min(MAX_COUNT, Number(digits || 0)));
			}}
			className={`border-line bg-surface text-ink min-h-11 min-w-0 rounded-md border-[1.5px] px-3 text-right font-mono lg:min-h-9 ${className}`}
		/>
	);
}

interface CountControlProps {
	name: string;
	value: number;
	step: number;
	onChange: (value: number) => void;
	className?: string;
}

export function CountControl({ name, value, step, onChange, className = "" }: CountControlProps) {
	const t = useTranslations("resources.countControl");

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			<IconButton
				label={t("remove", { step: formatNumber(step), name })}
				disabled={value <= 0}
				onClick={() => onChange(Math.max(0, value - step))}
				className="border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40"
			>
				<LuMinus size={16} aria-hidden="true" />
			</IconButton>
			<CountInput
				label={t("owned", { name })}
				value={value}
				onChange={onChange}
				className="w-32 flex-1"
			/>
			<IconButton
				label={t("add", { step: formatNumber(step), name })}
				disabled={value >= MAX_COUNT}
				onClick={() => onChange(Math.min(MAX_COUNT, value + step))}
				className="border-line bg-surface hover:bg-tint border-[1.5px] disabled:opacity-40"
			>
				<LuPlus size={16} aria-hidden="true" />
			</IconButton>
		</div>
	);
}
