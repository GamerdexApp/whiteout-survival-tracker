import type { ReactNode } from "react";
import { Card } from "@/comps/ui/Card";

export interface DetailRow {
	label: string;
	value: ReactNode;
}

export function DetailRows({ rows }: { rows: DetailRow[] }) {
	return (
		<Card className="px-4">
			<dl className="flex flex-col">
				{rows.map((row) => (
					<div
						key={row.label}
						className="border-line grid grid-cols-1 gap-1 border-t-[1.5px] py-2.5 first:border-t-0 sm:grid-cols-[10rem_1fr] sm:gap-4"
					>
						<dt className="text-muted">{row.label}</dt>
						<dd className="min-w-0 wrap-break-word">{row.value}</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}
