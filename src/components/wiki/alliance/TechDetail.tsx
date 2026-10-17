import type { AllianceTechLevel, AllianceTechNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { bonusOfLevel, timeOfLevel } from "@/service/wikiAllianceTech";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { CardRows } from "../cost/CardRows";
import { ResourceCostList } from "../cost/ResourceCostList";
import { RecordSection } from "../records/RecordParts";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import { TechRequirements } from "./TechRequirements";
import { DurationOrUnknown, TextOrUnknown } from "./values";

export function TechDetail({ node }: { node: AllianceTechNode }) {
	const t = useTranslations("wikiAllianceTech.detail");
	const tRoot = useTranslations("wikiAllianceTech");
	const levelsText = tRoot("levels", {
		count: node.levels.length,
		amount: formatNumber(node.levels.length),
	});

	const facts = [
		["category", node.category],
		[
			"tier",
			<span key="tier" className="font-mono">
				{formatNumber(node.tier)}
			</span>,
		],
		["effect", node.description],
		["stat", <TextOrUnknown key="stat" text={node.stat} />],
		["levels", levelsText],
	] as const;

	const columns: RecordColumn<AllianceTechLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (level) => (
				<span className="font-mono font-semibold">
					{t("level", { level: formatNumber(level.level) })}
				</span>
			),
		},
		{
			id: "bonus",
			header: t("columns.bonus"),
			cell: (level) => (
				<span className="font-mono">
					<TextOrUnknown text={bonusOfLevel(node, level)} />
				</span>
			),
		},
		{
			id: "cost",
			header: t("columns.cost"),
			cell: (level) =>
				level.cost.length > 0 ? (
					<ResourceCostList cost={level.cost} exact />
				) : (
					<UnknownValue />
				),
		},
		{
			id: "time",
			header: t("columns.time"),
			cell: (level) => (
				<span className="font-mono">
					<DurationOrUnknown seconds={timeOfLevel(level)} />
				</span>
			),
		},
		{
			id: "requires",
			header: t("columns.requires"),
			cell: (level) => <TechRequirements level={level} />,
		},
	];

	return (
		<>
			<RecordSection title={t("facts")}>
				<Card className="flex flex-col gap-3 p-4">
					<ItemIcon src={node.img} size={48} />
					<dl className="grid grid-cols-[auto_1fr] gap-x-4">
						{facts.map(([field, value]) => (
							<div
								key={field}
								className="border-line col-span-2 grid grid-cols-subgrid border-b py-2 last:border-b-0"
							>
								<dt className="text-muted">{t(`fields.${field}`)}</dt>
								<dd>{value}</dd>
							</div>
						))}
					</dl>
				</Card>
			</RecordSection>
			<RecordSection title={t("levelsTitle")} meta={levelsText}>
				<CardRows
					columns={columns}
					rows={node.levels}
					rowKey={(level) => String(level.level)}
				/>
			</RecordSection>
		</>
	);
}
