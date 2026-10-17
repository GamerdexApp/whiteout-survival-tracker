import type { ResearchNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { bonusText } from "@/service/research";
import { timeOfLevel } from "@/service/wikiResearch";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { RowButton } from "../cost/RowButton";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { BonusText, PowerText, TimeText } from "./values";

export function NodeList({
	nodes,
	onSelect,
}: {
	nodes: ResearchNode[];
	onSelect: (node: ResearchNode) => void;
}) {
	const t = useTranslations("wikiResearch.list");

	if (nodes.length === 0) {
		return (
			<Card className="p-4 text-center">
				<p className="font-semibold">{t("empty")}</p>
				<p className="text-muted">{t("emptyHint")}</p>
			</Card>
		);
	}

	const columns: RecordColumn<ResearchNode>[] = [
		{
			id: "node",
			header: t("columns.node"),
			heading: true,
			cell: (node) => (
				<RowButton onClick={() => onSelect(node)}>
					<ItemIcon src={node.img} size={24} />
					<span className="flex flex-col">
						<span>{node.name}</span>
						<span className="text-muted text-xs font-normal">{node.category}</span>
					</span>
				</RowButton>
			),
		},
		{
			id: "tier",
			header: t("columns.tier"),
			cell: (node) => <span className="font-mono">{formatNumber(node.tier)}</span>,
		},
		{
			id: "levels",
			header: t("columns.levels"),
			cell: (node) => <span className="font-mono">{formatNumber(node.levels.length)}</span>,
		},
		{
			id: "bonus",
			header: t("columns.bonus"),
			cell: (node) => <BonusText text={bonusText(node.levels[0])} />,
		},
		{
			id: "time",
			header: t("columns.time"),
			cell: (node) => (
				<span className="font-mono">
					<TimeText seconds={timeOfLevel(node, node.levels[0])} />
				</span>
			),
		},
		{
			id: "power",
			header: t("columns.power"),
			cell: (node) => (
				<span className="font-mono">
					<PowerText power={node.levels[0].power} />
				</span>
			),
		},
	];

	return <RecordTable columns={columns} rows={nodes} rowKey={(node) => node.id} />;
}
