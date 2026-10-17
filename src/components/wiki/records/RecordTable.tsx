import type { ReactNode } from "react";
import { Card } from "@/comps/ui/Card";

export interface RecordColumn<Row> {
	id: string;
	header: string;
	cell: (row: Row) => ReactNode;
	/** The first cell of a row. It becomes the card heading on mobile. */
	heading?: boolean;
}

interface RecordTableProps<Row> {
	columns: RecordColumn<Row>[];
	rows: Row[];
	rowKey: (row: Row) => string;
	isSelected?: (row: Row) => boolean;
}

/** A table from 1024 px. Below that each row is a card with a label before each value. */
export function RecordTable<Row>({ columns, rows, rowKey, isSelected }: RecordTableProps<Row>) {
	return (
		<Card className="relative overflow-hidden max-lg:border-0 max-lg:bg-transparent">
			<table className="w-full text-start max-lg:block">
				<thead className="max-lg:sr-only">
					<tr className="border-line border-b-[1.5px]">
						{columns.map((column) => (
							<th
								key={column.id}
								scope="col"
								className="text-muted px-3 py-2 font-mono text-xs font-normal tracking-[0.06em] uppercase"
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="max-lg:flex max-lg:flex-col max-lg:gap-2">
					{rows.map((row) => (
						<tr
							key={rowKey(row)}
							className={`border-line max-lg:bg-surface border-b-[1.5px] last:border-b-0 max-lg:flex max-lg:flex-col max-lg:gap-1 max-lg:rounded-md max-lg:border-[1.5px] max-lg:p-3 max-lg:last:border-b-[1.5px] ${
								isSelected?.(row) ? "bg-tint max-lg:border-primary" : ""
							}`}
						>
							{columns.map((column) => (
								<td
									key={column.id}
									data-label={column.heading ? undefined : column.header}
									className={`px-3 py-2 align-top max-lg:p-0 ${
										column.heading
											? ""
											: "max-lg:before:text-muted max-lg:flex max-lg:justify-between max-lg:gap-3 max-lg:before:shrink-0 max-lg:before:content-[attr(data-label)]"
									}`}
								>
									{column.heading ? (
										column.cell(row)
									) : (
										<span className="max-lg:text-end">{column.cell(row)}</span>
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</Card>
	);
}
