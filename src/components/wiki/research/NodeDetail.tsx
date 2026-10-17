import type { ResearchLevel, ResearchNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { bonusText } from "@/service/research";
import { requirementsOf, timeOfLevel } from "@/service/wikiResearch";
import type { Requirement } from "@/service/wikiResearch";
import { isPlaceholder } from "@/data/game/research";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { CardRows } from "../cost/CardRows";
import { ResourceCostList } from "../cost/ResourceCostList";
import { RecordSection } from "../records/RecordParts";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import { BonusText, PowerText, TimeText } from "./values";

function RequirementList({ requirements }: { requirements: Requirement[] }) {
	const t = useTranslations("wikiResearch.detail");

	if (requirements.length === 0) return <span className="text-muted">{t("none")}</span>;

	return (
		<ul className="flex flex-col gap-0.5 max-lg:items-end">
			{requirements.map((requirement) => (
				<li key={`${requirement.kind}-${requirement.name}`}>
					{requirement.kind === "building"
						? t("requirement.building", {
								name: requirement.name,
								level: requirement.level,
							})
						: t("requirement.research", {
								name: requirement.name,
								level: formatNumber(requirement.level),
							})}
				</li>
			))}
		</ul>
	);
}

export function NodeDetail({ node }: { node: ResearchNode }) {
	const t = useTranslations("wikiResearch.detail");
	const tRoot = useTranslations("wikiResearch");
	const levelsText = tRoot("levels", {
		count: node.levels.length,
		amount: formatNumber(node.levels.length),
	});
	const indexOf = (level: ResearchLevel) => node.levels.indexOf(level);

	const columns: RecordColumn<ResearchLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (level) => (
				<span className="font-mono font-semibold whitespace-nowrap">
					{t("level", { level: formatNumber(level.level) })}
				</span>
			),
		},
		{
			id: "requires",
			header: t("columns.requires"),
			cell: (level) => (
				<RequirementList requirements={requirementsOf(node, indexOf(level))} />
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
					<TimeText seconds={timeOfLevel(node, level)} />
				</span>
			),
		},
		{
			id: "bonus",
			header: t("columns.bonus"),
			cell: (level) => <BonusText text={bonusText(level)} />,
		},
		{
			id: "power",
			header: t("columns.power"),
			cell: (level) => (
				<span className="font-mono">
					<PowerText power={level.power} />
				</span>
			),
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<ItemIcon src={node.img} size={64} />
			<RecordSection title={t("levelsTitle")} meta={levelsText}>
				{isPlaceholder(node) && <Note>{t("placeholderNote")}</Note>}
				<CardRows
					columns={columns}
					rows={node.levels}
					rowKey={(level) => String(level.level)}
				/>
			</RecordSection>
		</div>
	);
}
