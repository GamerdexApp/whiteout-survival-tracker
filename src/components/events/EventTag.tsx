import type { ReactNode } from "react";

export function EventTag({ children }: { children: ReactNode }) {
	return (
		<span className="border-line text-muted inline-flex items-center rounded-full border-[1.5px] px-2 font-mono text-[11px] whitespace-nowrap">
			{children}
		</span>
	);
}
