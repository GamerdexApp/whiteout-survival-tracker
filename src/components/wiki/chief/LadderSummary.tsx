import { formatDecimal, formatNumber } from "@/lib/format";
import type { LadderGroupSummary } from "@/service/wikiChiefGear";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";

interface LadderSummaryProps {
	label: string;
	headers: { group: string; rows: string; stats: string; power: string };
	groups: LadderGroupSummary[];
	groupName: (key: string) => string;
	statsRange: (first: string, last: string) => string;
}

export function LadderSummary({
	label,
	headers,
	groups,
	groupName,
	statsRange,
}: LadderSummaryProps) {
	const columns: StackColumn<LadderGroupSummary>[] = [
		{
			id: "group",
			header: headers.group,
			width: "minmax(0,1.2fr)",
			render: (group) => (
				<span className="font-mono font-semibold">{groupName(group.key)}</span>
			),
		},
		{
			id: "rows",
			header: headers.rows,
			width: "5rem",
			render: (group) => formatNumber(group.rowCount),
		},
		{
			id: "stats",
			header: headers.stats,
			width: "minmax(0,1.4fr)",
			render: (group) =>
				statsRange(
					formatDecimal(group.firstStatPercent),
					formatDecimal(group.lastStatPercent)
				),
		},
		{
			id: "power",
			header: headers.power,
			width: "minmax(0,1.2fr)",
			render: (group) => formatNumber(group.lastPower),
		},
	];

	return (
		<StackTable label={label} columns={columns} rows={groups} rowKey={(group) => group.key} />
	);
}
