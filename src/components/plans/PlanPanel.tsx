import type { ReactNode } from "react";

/**
 * The tinted panel of read only values and switches that sets a bonus of a plan, such as its
 * speed. Each child is one section, and the panel draws a line between sections.
 */
export function PlanPanel({ children }: { children: ReactNode }) {
	return (
		<div className="border-line bg-tint [&>*+*]:border-line flex flex-col gap-3 rounded-md border-[1.5px] p-3 [&>*+*]:border-t-[1.5px] [&>*+*]:pt-3">
			{children}
		</div>
	);
}

interface PanelRowProps {
	label: string;
	/** The value, the badge or the control at the end of the row. */
	children?: ReactNode;
	/** Text under the row. */
	note?: ReactNode;
	emphasis?: boolean;
}

export function PanelRow({ label, children, note, emphasis = false }: PanelRowProps) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
				<span className={emphasis ? "font-semibold" : "font-medium"}>{label}</span>
				<span className="flex items-center gap-2">{children}</span>
			</div>
			{note && <div className="text-muted text-xs">{note}</div>}
		</div>
	);
}
