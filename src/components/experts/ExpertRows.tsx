import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export function ExpertRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="border-line flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-1 first:border-t-0">
			<span>{label}</span>
			<span className="flex flex-wrap items-center gap-2">{children}</span>
		</div>
	);
}

export function GoalText({ goal }: { goal: number | null }) {
	const t = useTranslations("experts.card");

	if (goal === null) return null;
	return (
		<span className="text-primary font-mono text-xs font-medium">
			{t("goal", { goal: formatNumber(goal) })}
		</span>
	);
}

const parseCount = (text: string) => Number(text.replace(/\D/g, "") || 0);

export function HeldInput({
	label,
	value,
	disabled = false,
	onChange,
}: {
	label: string;
	value: number;
	disabled?: boolean;
	onChange: (value: number) => void;
}) {
	return (
		<input
			inputMode="numeric"
			aria-label={label}
			value={formatNumber(value)}
			disabled={disabled}
			onChange={(event) => onChange(parseCount(event.target.value))}
			className="border-line bg-surface text-ink min-h-11 w-28 rounded-md border-[1.5px] px-2 text-right font-mono font-medium disabled:opacity-60 lg:min-h-8"
		/>
	);
}
