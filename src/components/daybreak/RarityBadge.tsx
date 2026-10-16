import type { DecorationCategory } from "whiteout-survival-data";

const toneClasses: Partial<Record<DecorationCategory, string>> = {
	Common: "text-kept bg-kept/10",
	Rare: "text-added bg-added/10",
	Epic: "text-fixed bg-fixed/10",
	Mythic: "text-changed bg-changed/10",
};

const NEUTRAL_CLASSES = "text-muted";

export function RarityBadge({
	category,
	children,
}: {
	category?: DecorationCategory;
	children: string;
}) {
	return (
		<span
			className={`inline-flex items-center rounded-full border-[1.5px] border-current px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] ${(category && toneClasses[category]) || NEUTRAL_CLASSES}`}
		>
			{children}
		</span>
	);
}
