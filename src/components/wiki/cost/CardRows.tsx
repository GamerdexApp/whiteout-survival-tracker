import type { RecordColumn } from "../records/RecordTable";

interface CardRowsProps<Row> {
	columns: RecordColumn<Row>[];
	rows: Row[];
	rowKey: (row: Row) => string;
}

/** Rows as cards with a label before each value. A flyout is narrow, so it never uses a wide table. */
export function CardRows<Row>({ columns, rows, rowKey }: CardRowsProps<Row>) {
	const heading = columns.find((column) => column.heading);
	const fields = columns.filter((column) => column !== heading);

	if (heading && fields.length === 1) {
		const [field] = fields;
		return (
			<ul className="flex flex-col gap-2">
				{rows.map((row) => (
					<li
						key={rowKey(row)}
						className="border-line bg-surface flex min-h-11 items-center justify-between gap-3 rounded-md border-[1.5px] px-3 py-2"
					>
						<span className="flex gap-1.5 font-semibold">
							<span>{heading.header}</span>
							{heading.cell(row)}
						</span>
						<span className="min-w-0 text-end">{field.cell(row)}</span>
					</li>
				))}
			</ul>
		);
	}

	return (
		<ul className="flex flex-col gap-2">
			{rows.map((row) => (
				<li
					key={rowKey(row)}
					className="border-line bg-surface flex flex-col gap-1.5 rounded-md border-[1.5px] p-3"
				>
					{heading && <span className="font-semibold">{heading.cell(row)}</span>}
					{fields.map((column) => (
						<div key={column.id} className="flex justify-between gap-3">
							<span className="text-muted shrink-0">{column.header}</span>
							<span className="min-w-0 text-end">{column.cell(row)}</span>
						</div>
					))}
				</li>
			))}
		</ul>
	);
}
