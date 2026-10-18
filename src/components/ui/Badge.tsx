import type { ReactNode } from "react";

type BadgeTone = "kept" | "changed" | "added" | "fixed" | "locked" | "warn";

const toneClasses: Record<BadgeTone, string> = {
	kept: "text-kept",
	changed: "text-changed",
	added: "text-added",
	fixed: "text-fixed",
	locked: "text-locked",
	warn: "text-warn",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
	return (
		<span
			className={`inline-flex shrink-0 items-center rounded-full border-[1.5px] border-current px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] whitespace-nowrap uppercase ${toneClasses[tone]}`}
		>
			{children}
		</span>
	);
}
