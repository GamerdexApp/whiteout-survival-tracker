import type { ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";
import { Card } from "./Card";

interface CollapsibleSectionProps {
	title: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export function CollapsibleSection({
	title,
	defaultOpen = false,
	children,
}: CollapsibleSectionProps) {
	return (
		<Card>
			<details open={defaultOpen} className="group">
				<summary className="text-ink flex min-h-11 list-none items-center justify-between gap-3 rounded-md px-4 py-2 font-semibold [&::-webkit-details-marker]:hidden">
					{title}
					<LuChevronDown
						size={16}
						aria-hidden="true"
						className="text-muted shrink-0 transition-transform group-open:rotate-180"
					/>
				</summary>
				<div className="flex flex-col gap-5 px-4 pt-1 pb-4">{children}</div>
			</details>
		</Card>
	);
}
