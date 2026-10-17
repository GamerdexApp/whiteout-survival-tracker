import type { CSSProperties, ReactNode } from "react";

export interface StackColumn<Row> {
	id: string;
	header: string;
	/** Grid column width from the lg breakpoint up. */
	width: string;
	render: (row: Row) => ReactNode;
}

interface StackTableProps<Row> {
	label: string;
	columns: StackColumn<Row>[];
	rows: Row[];
	rowKey: (row: Row) => string;
	selectedKey?: string;
}

/**
 * A table from the lg breakpoint up. Below it each row is a card, and the first column is the card
 * heading.
 */
export function StackTable<Row>({
	label,
	columns,
	rows,
	rowKey,
	selectedKey,
}: StackTableProps<Row>) {
	const gridStyle = {
		"--columns": columns.map((column) => column.width).join(" "),
	} as CSSProperties;

	return (
		<div
			role="table"
			aria-label={label}
			style={gridStyle}
			className="border-line bg-surface overflow-hidden rounded-md border-[1.5px]"
		>
			<div
				role="row"
				className="border-line text-muted hidden gap-3 border-b-[1.5px] px-3 py-2 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid lg:[grid-template-columns:var(--columns)]"
			>
				{columns.map((column) => (
					<div key={column.id} role="columnheader">
						{column.header}
					</div>
				))}
			</div>
			{rows.map((row) => {
				const key = rowKey(row);
				return (
					<div
						key={key}
						role="row"
						className={`border-line grid gap-2 border-t-[1.5px] px-3 py-3 first:border-t-0 lg:[grid-template-columns:var(--columns)] lg:items-center lg:gap-3 ${
							key === selectedKey ? "bg-tint" : ""
						}`}
					>
						{columns.map((column, index) => (
							<div
								key={column.id}
								role={index === 0 ? "rowheader" : "cell"}
								className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 lg:block"
							>
								{index > 0 && (
									<span className="text-muted text-xs lg:hidden">
										{column.header}
									</span>
								)}
								{column.render(row)}
							</div>
						))}
					</div>
				);
			})}
		</div>
	);
}
