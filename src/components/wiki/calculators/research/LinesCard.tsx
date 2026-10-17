"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import {
	levelOptions,
	levelsOf,
	plannedLineCount,
	withLevel,
	withLevelForAll,
} from "@/service/calcResearch";
import type { LevelKey, ResearchCalculatorInputs } from "@/service/calcResearch";
import type { ResearchNode, ResearchTabId } from "@/data/game/calcResearch";
import {
	gameOrder,
	maxLevelOf,
	nodesOfTab,
	researchTabs,
	troopLineOf,
} from "@/data/game/calcResearch";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { Tabs } from "@/comps/ui/Tabs";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";

const LEVEL_KEYS: LevelKey[] = ["current", "goal"];

const sortedNodesOfTab = Object.fromEntries(
	researchTabs.map((tab) => [tab.id, [...nodesOfTab(tab)].sort(gameOrder)])
) as Record<ResearchTabId, ResearchNode[]>;

interface LinesCardProps {
	inputs: ResearchCalculatorInputs;
	onChange: (inputs: ResearchCalculatorInputs) => void;
}

export function LinesCard({ inputs, onChange }: LinesCardProps) {
	const t = useTranslations("calcResearch.lines");
	const [activeTabId, setActiveTabId] = useState<ResearchTabId>(researchTabs[0].id);
	const nodes = sortedNodesOfTab[activeTabId];

	const tabs = researchTabs.map((tab) => {
		const planned = plannedLineCount(inputs, sortedNodesOfTab[tab.id]);
		return { id: tab.id, label: t(`tabs.${tab.id}`), count: planned > 0 ? planned : undefined };
	});

	const tierText = (node: ResearchNode) => {
		const line = troopLineOf(node);
		const tier = formatNumber(node.tier);
		return line ? t("tier.troopLine", { line, tier }) : t("tier.plain", { tier });
	};

	const levelLabel = (level: number, max: number) =>
		level === max ? t("levelMax", { level: formatNumber(level) }) : formatNumber(level);

	const levelSelect = (node: ResearchNode, key: LevelKey) => {
		const levels = levelsOf(inputs, node.id);
		const max = maxLevelOf(node);
		const from = key === "goal" ? levels.current : 0;
		return (
			<Select
				aria-label={t(`levelLabel.${key}`, { name: node.name })}
				value={levels[key]}
				onChange={(event) =>
					onChange(withLevel(inputs, node.id, key, Number(event.target.value)))
				}
			>
				{levelOptions(from, max).map((level) => (
					<option key={level} value={level}>
						{levelLabel(level, max)}
					</option>
				))}
			</Select>
		);
	};

	const columns: StackColumn<ResearchNode>[] = [
		{
			id: "line",
			header: t("columns.line"),
			width: "minmax(0, 1fr)",
			render: (node) => (
				<span className="flex items-center gap-2">
					<ItemIcon src={node.img || undefined} size={32} />
					<span className="flex min-w-0 flex-col">
						<span className="font-medium">{node.name}</span>
						<span className="text-muted text-xs">{tierText(node)}</span>
					</span>
				</span>
			),
		},
		{
			id: "current",
			header: t("columns.current"),
			width: "8rem",
			render: (node) => <div className="w-32 lg:w-auto">{levelSelect(node, "current")}</div>,
		},
		{
			id: "goal",
			header: t("columns.goal"),
			width: "8rem",
			render: (node) => <div className="w-32 lg:w-auto">{levelSelect(node, "goal")}</div>,
		},
	];

	const highestLevel = Math.max(...nodes.map(maxLevelOf));

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<p className="text-muted">{t("description")}</p>
			<Tabs
				label={t("tabsLabel")}
				tabs={tabs}
				activeId={activeTabId}
				onChange={setActiveTabId}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
					{LEVEL_KEYS.map((key) => (
						<Field key={key} label={t(`bulk.${key}`)}>
							<Select
								value=""
								onChange={(event) =>
									onChange(
										withLevelForAll(
											inputs,
											nodes,
											key,
											Number(event.target.value)
										)
									)
								}
							>
								<option value="" disabled>
									{t("bulk.pick")}
								</option>
								{levelOptions(0, highestLevel).map((level) => (
									<option key={level} value={level}>
										{levelLabel(level, highestLevel)}
									</option>
								))}
							</Select>
						</Field>
					))}
				</div>
				<StackTable
					label={t("tableLabel")}
					columns={columns}
					rows={nodes}
					rowKey={(node) => node.id}
				/>
			</Tabs>
		</Card>
	);
}
