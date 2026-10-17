import type { AllianceTechNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { bonusOfLevel, timeOfLevel } from "@/service/wikiAllianceTech";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ResourceCostList } from "../cost/ResourceCostList";
import { RowButton } from "../cost/RowButton";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import { TechRequirements } from "./TechRequirements";
import { DurationOrUnknown, TextOrUnknown } from "./values";

const maxBonusOf = (node: AllianceTechNode) =>
	bonusOfLevel(node, node.levels[node.levels.length - 1]);

export function TechList({
	nodes,
	onSelect,
}: {
	nodes: AllianceTechNode[];
	onSelect: (node: AllianceTechNode) => void;
}) {
	const t = useTranslations("wikiAllianceTech.list");

	if (nodes.length === 0) {
		return (
			<Card className="p-4 text-center">
				<p className="font-semibold">{t("empty")}</p>
				<p className="text-muted">{t("emptyHint")}</p>
			</Card>
		);
	}

	const columns: RecordColumn<AllianceTechNode>[] = [
		{
			id: "tech",
			header: t("columns.tech"),
			heading: true,
			cell: (node) => (
				<RowButton onClick={() => onSelect(node)}>
					<ItemIcon src={node.img} size={24} />
					{node.name}
				</RowButton>
			),
		},
		{ id: "category", header: t("columns.category"), cell: (node) => node.category },
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
			id: "maxBonus",
			header: t("columns.maxBonus"),
			cell: (node) => (
				<span className="font-mono">
					<TextOrUnknown text={maxBonusOf(node)} />
				</span>
			),
		},
		{
			id: "cost",
			header: t("columns.cost"),
			cell: (node) =>
				node.levels[0].cost.length > 0 ? (
					<ResourceCostList cost={node.levels[0].cost} />
				) : (
					<UnknownValue />
				),
		},
		{
			id: "time",
			header: t("columns.time"),
			cell: (node) => (
				<span className="font-mono">
					<DurationOrUnknown seconds={timeOfLevel(node.levels[0])} />
				</span>
			),
		},
		{
			id: "requires",
			header: t("columns.requires"),
			cell: (node) => <TechRequirements level={node.levels[0]} />,
		},
	];

	return <RecordTable columns={columns} rows={nodes} rowKey={(node) => node.id} />;
}
