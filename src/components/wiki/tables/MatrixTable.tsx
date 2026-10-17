import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { Card } from "@/comps/ui/Card";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";

export interface MatrixGroup {
	id: string;
	title: ReactNode;
	columns: { id: string; header: ReactNode }[];
}

export interface MatrixRow {
	id: string;
	label: ReactNode;
	/** One value for each column of every group, in order. A null value is a cost of none. */
	cells: (number | null)[];
	emphasis?: "subtotal" | "total";
}

interface MatrixTableProps {
	label: string;
	rowHeader: string;
	groups: MatrixGroup[];
	rows: MatrixRow[];
}

const stickyCell = "bg-surface sticky start-0 z-1";
const headerCell = "text-muted px-3 py-2 font-mono text-xs font-normal";

/** Costs for each row across grouped columns. The first column stays visible while the rest scroll. */
export function MatrixTable({ label, rowHeader, groups, rows }: MatrixTableProps) {
	return (
		<Card className="overflow-hidden">
			<ScrollRegion label={label} className="relative overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th
								scope="col"
								rowSpan={2}
								className={`${headerCell} ${stickyCell} min-w-40 text-start align-bottom`}
							>
								{rowHeader}
							</th>
							{groups.map((group) => (
								<th
									key={group.id}
									scope="colgroup"
									colSpan={group.columns.length}
									className="border-line border-s-[1.5px] px-3 pt-3 pb-1 text-center font-semibold"
								>
									{group.title}
								</th>
							))}
						</tr>
						<tr className="border-line border-b-[1.5px]">
							{groups.flatMap((group) =>
								group.columns.map((column, index) => (
									<th
										key={`${group.id}-${column.id}`}
										scope="col"
										className={`${headerCell} text-center ${index === 0 ? "border-line border-s-[1.5px]" : ""}`}
									>
										{column.header}
									</th>
								))
							)}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const emphasised = row.emphasis !== undefined;
							const rowTint = emphasised ? "bg-tint font-semibold" : "";
							return (
								<tr
									key={row.id}
									className={`border-line border-t-[1.5px] ${rowTint}`}
								>
									<th
										scope="row"
										className={`${stickyCell} px-3 py-2 text-start font-normal ${emphasised ? "bg-tint font-semibold" : ""}`}
									>
										{row.label}
									</th>
									{row.cells.map((value, index) => (
										<td key={index} className="px-3 py-2 text-end font-mono">
											{value === null ? (
												<span className="text-muted">-</span>
											) : (
												formatNumber(value)
											)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</ScrollRegion>
		</Card>
	);
}
