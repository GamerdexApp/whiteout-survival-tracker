import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export function HeroRow({
	label,
	children,
	muted = false,
}: {
	label: string;
	children: ReactNode;
	muted?: boolean;
}) {
	return (
		<div className="border-line flex min-h-9 items-center justify-between gap-3 border-t-[1.5px] py-1 first:border-t-0">
			<span className={muted ? "text-muted" : ""}>{label}</span>
			<span className="flex items-center gap-2">{children}</span>
		</div>
	);
}

export function GoalText({ goal, empty }: { goal: string | null; empty?: string }) {
	const t = useTranslations("heroes.goalText");

	if (goal === null) {
		return empty ? <span className="text-muted font-mono text-xs">{empty}</span> : null;
	}
	return <span className="text-primary font-mono text-xs font-medium">{t("to", { goal })}</span>;
}

export function ShardTile({ src }: { src?: string }) {
	if (!src) {
		return (
			<span
				aria-hidden="true"
				className="border-line size-6 shrink-0 rounded-md border-[1.5px] border-dashed"
			/>
		);
	}
	return <ItemIcon src={src} size={24} />;
}

const parseCount = (text: string) => Number(text.replace(/\D/g, "") || 0);

/**
 * The shard count of a hero. The number always shows with separators, so typing never changes
 * its shape.
 */
export function ShardsInput({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<input
			inputMode="numeric"
			aria-label={label}
			value={formatNumber(value)}
			onChange={(event) => onChange(parseCount(event.target.value))}
			className="border-line bg-surface text-ink min-h-11 w-24 rounded-md border-[1.5px] px-2 text-end font-mono font-medium lg:min-h-9"
		/>
	);
}
