import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/comps/ui/Card";

export interface TableColumn<Row> {
	id: string;
	header: string;
	render: (row: Row) => ReactNode;
	numeric?: boolean;
	wideOnCard?: boolean;
	/** A width for the column from 1024 px, for example 12rem. Columns without one share the rest. */
	width?: string;
}

interface ResponsiveTableProps<Row> {
	label: string;
	columns: TableColumn<Row>[];
	rows: Row[];
	rowKey: (row: Row, index: number) => string;
	titleColumnId: string;
	/** The address of the record page of a row. Without it the rows are plain. */
	rowHref?: (row: Row) => string;
	/** Opens the record in a flyout. The title cell and the card become buttons. */
	onRowSelect?: (row: Row) => void;
}

const headerClasses = "text-muted px-3 py-2 text-left font-mono text-xs font-normal uppercase";

/** A table from 1024 px and a list of cards below it. Each row can link to a record page. */
export function ResponsiveTable<Row>({
	label,
	columns,
	rows,
	rowKey,
	titleColumnId,
	rowHref,
	onRowSelect,
}: ResponsiveTableProps<Row>) {
	const titleColumn = columns.find((column) => column.id === titleColumnId) ?? columns[0];
	const cardColumns = columns.filter((column) => column !== titleColumn);

	return (
		<>
			<Card className="hidden overflow-hidden lg:block">
				<table aria-label={label} className="w-full border-collapse">
					<thead>
						<tr>
							{columns.map((column) => (
								<th
									key={column.id}
									scope="col"
									style={column.width ? { width: column.width } : undefined}
									className={`${headerClasses} ${column.numeric ? "text-right" : ""}`}
								>
									{column.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, index) => {
							const key = rowKey(row, index);
							const href = rowHref?.(row);
							return (
								<tr
									key={key}
									className="border-line hover:bg-tint border-t-[1.5px] align-top"
								>
									{columns.map((column) => (
										<td
											key={column.id}
											className={`px-3 py-2.5 ${column.numeric ? "text-right font-mono" : ""}`}
										>
											{column === titleColumn && href ? (
												<Link
													href={href}
													className="inline-flex min-h-11 min-w-11 items-center font-semibold underline lg:min-h-9 lg:min-w-9"
												>
													{column.render(row)}
												</Link>
											) : column === titleColumn && onRowSelect ? (
												<button
													type="button"
													aria-haspopup="dialog"
													onClick={() => onRowSelect(row)}
													className="inline-flex min-h-11 min-w-11 items-center text-left font-semibold underline lg:min-h-9 lg:min-w-9"
												>
													{column.render(row)}
												</button>
											) : (
												column.render(row)
											)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>
			<ul aria-label={label} className="flex flex-col gap-2 lg:hidden">
				{rows.map((row, index) => {
					const key = rowKey(row, index);
					const href = rowHref?.(row);
					const body = (
						<>
							<span className="block font-semibold">{titleColumn.render(row)}</span>
							<span className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
								{cardColumns.map((column) => (
									<span
										key={column.id}
										className={`block min-w-0 break-words ${column.wideOnCard ? "col-span-2" : ""}`}
									>
										<span className="text-muted block font-mono text-xs uppercase">
											{column.header}
										</span>
										<span className="block">{column.render(row)}</span>
									</span>
								))}
							</span>
						</>
					);
					const cardClasses = `border-line bg-surface block min-h-11 w-full rounded-md border-[1.5px] p-3 text-left`;
					return (
						<li key={key}>
							{href ? (
								<Link href={href} className={cardClasses}>
									{body}
								</Link>
							) : onRowSelect ? (
								<button
									type="button"
									aria-haspopup="dialog"
									onClick={() => onRowSelect(row)}
									className={cardClasses}
								>
									{body}
								</button>
							) : (
								<div className={cardClasses}>{body}</div>
							)}
						</li>
					);
				})}
			</ul>
		</>
	);
}
