"use client";

import type { ResearchNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	filterWikiNodes,
	hasMissingTime,
	nodesOfWikiTab,
	tiersOfNodes,
	treeTabsOfWikiTab,
	TROOP_FILTER_TABS,
	TROOP_LINES,
	WIKI_RESEARCH_TAB_IDS,
} from "@/service/wikiResearch";
import type { DataFilter, TroopLine, WikiResearchTabId } from "@/service/wikiResearch";
import { allResearch, isPlaceholder } from "@/data/game/research";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Tabs } from "@/comps/ui/Tabs";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { NodeDetail } from "../research/NodeDetail";
import { NodeList } from "../research/NodeList";
import { WikiResearchTree } from "../research/WikiResearchTree";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function ResearchPage({ recordId }: WikiPageProps) {
	return recordId === undefined ? <ResearchList /> : <WikiRecordMissing id="research" />;
}

function ResearchList() {
	const t = useTranslations("wikiResearch");
	const [tab, setTab] = useState<WikiResearchTabId>("battle");
	const [query, setQuery] = useState("");
	const [tier, setTier] = useState<number | null>(null);
	const [troopLine, setTroopLine] = useState<TroopLine | null>(null);
	const [data, setData] = useState<DataFilter>("all");
	const [openNode, setOpenNode] = useState<ResearchNode>();
	const [view, setView] = useState<"list" | "tree">("list");

	const tabNodes = nodesOfWikiTab(tab);
	const nodes = filterWikiNodes(tabNodes, { query, tier, troopLine, data });
	const matchingIds = new Set(nodes.map((node) => node.id));
	const showTroopFilter = TROOP_FILTER_TABS.includes(tab);
	const dataOptions: DataFilter[] = [
		"all",
		...(tabNodes.some(isPlaceholder) ? (["placeholders"] as const) : []),
		...(tabNodes.some(hasMissingTime) ? (["missingTime"] as const) : []),
	];

	const changeTab = (next: WikiResearchTabId) => {
		setTab(next);
		setTier(null);
		setTroopLine(null);
		setData("all");
	};

	return (
		<WikiPageShell
			id="research"
			line={t("line", {
				nodes: formatNumber(allResearch.length),
				tabs: formatNumber(WIKI_RESEARCH_TAB_IDS.length),
			})}
		>
			<RecordSection
				title={t("list.title")}
				meta={t("list.count", { count: nodes.length, amount: formatNumber(nodes.length) })}
			>
				<Tabs
					label={t("tabsLabel")}
					activeId={tab}
					onChange={changeTab}
					tabs={WIKI_RESEARCH_TAB_IDS.map((id) => ({
						id,
						label: t(`tabs.${id}`),
						count: nodesOfWikiTab(id).length,
					}))}
				>
					<RecordFilters>
						<Field label={t("search.label")}>
							<Input
								type="search"
								leadingIcon={<LuSearch size={16} />}
								value={query}
								placeholder={t("search.placeholder", {
									amount: formatNumber(tabNodes.length),
								})}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</Field>
						<Field label={t("filters.tier")}>
							<Select
								value={tier ?? ""}
								onChange={(event) =>
									setTier(
										event.target.value === ""
											? null
											: Number(event.target.value)
									)
								}
							>
								<option value="">{t("filters.allTiers")}</option>
								{tiersOfNodes(tabNodes).map((value) => (
									<option key={value} value={value}>
										{t("filters.tierOption", { tier: formatNumber(value) })}
									</option>
								))}
							</Select>
						</Field>
						{showTroopFilter && (
							<Field label={t("filters.troop")}>
								<Select
									value={troopLine ?? ""}
									onChange={(event) =>
										setTroopLine(
											event.target.value === ""
												? null
												: (event.target.value as TroopLine)
										)
									}
								>
									<option value="">{t("filters.allTroops")}</option>
									{TROOP_LINES.map((line) => (
										<option key={line} value={line}>
											{t(`filters.troops.${line}`)}
										</option>
									))}
								</Select>
							</Field>
						)}
						{dataOptions.length > 1 && (
							<Field label={t("filters.data")}>
								<Select
									value={data}
									onChange={(event) => setData(event.target.value as DataFilter)}
								>
									{dataOptions.map((option) => (
										<option key={option} value={option}>
											{t(`filters.dataOptions.${option}`)}
										</option>
									))}
								</Select>
							</Field>
						)}
						<div className="self-end">
							<SegmentedControl
								label={t("view.label")}
								options={[
									{ id: "list", label: t("view.list") },
									{ id: "tree", label: t("view.tree") },
								]}
								value={view}
								onChange={setView}
							/>
						</div>
					</RecordFilters>
					{view === "list" ? (
						<NodeList nodes={nodes} onSelect={setOpenNode} />
					) : (
						<div className="flex flex-col gap-4">
							{treeTabsOfWikiTab(tab, troopLine).map((entry) => (
								<div key={entry.treeTabId} className="flex flex-col gap-2">
									{entry.troopLine && tab === "t12" && !troopLine && (
										<h3 className="font-semibold">
											{t(`filters.troops.${entry.troopLine}`)}
										</h3>
									)}
									<WikiResearchTree
										treeTabId={entry.treeTabId}
										matchingIds={matchingIds}
										onOpen={setOpenNode}
										regionLabel={t("tree.region", {
											tab: entry.troopLine
												? `${t(`tabs.${tab}`)} ${t(`filters.troops.${entry.troopLine}`)}`
												: t(`tabs.${tab}`),
										})}
									/>
								</div>
							))}
						</div>
					)}
				</Tabs>
			</RecordSection>
			{openNode && (
				<Flyout open onClose={() => setOpenNode(undefined)} title={openNode.name}>
					<NodeDetail node={openNode} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}
