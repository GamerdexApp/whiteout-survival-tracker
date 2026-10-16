import type { ReactNode } from "react";

/** Stretches a segmented control over the full width, with equal segments. */
export function FullWidthSegments({ children }: { children: ReactNode }) {
	return (
		<div className="[&_label]:flex-1 [&_label]:justify-center [&_label]:text-center [&>fieldset]:flex">
			{children}
		</div>
	);
}
