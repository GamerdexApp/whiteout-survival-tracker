import type { ResearchLevel, ResearchNode } from "whiteout-survival-data";
import { findBuildingById } from "@/data/game/buildings";
import {
  allResearch,
  findResearch,
  isPlaceholder,
  troopLineOf,
} from "@/data/game/research";
import { bonusText } from "./research";

export const WIKI_RESEARCH_TAB_IDS = [
  "battle",
  "growth",
  "economy",
  "t11",
  "t12",
] as const;
export type WikiResearchTabId = (typeof WIKI_RESEARCH_TAB_IDS)[number];

export const TROOP_LINES = ["Infantry", "Marksman", "Lancer"] as const;
export type TroopLine = (typeof TROOP_LINES)[number];

export type DataFilter = "all" | "placeholders" | "missingTime";

export const TROOP_FILTER_TABS: WikiResearchTabId[] = ["t11", "t12"];

const categoriesOfTab: Record<WikiResearchTabId, string[]> = {
  battle: ["Battle"],
  growth: ["Growth"],
  economy: ["Economy"],
  t11: ["T11 Infantry", "T11 Marksman", "T11 Lancer"],
  t12: ["T12 Infantry", "T12 Marksman", "T12 Lancer"],
};

export const nodesOfWikiTab = (tab: WikiResearchTabId) =>
  allResearch.filter((node) => categoriesOfTab[tab].includes(node.category));

export const hasMissingTime = (node: ResearchNode) =>
  node.levels.some((level) => level.researchTimeSeconds === undefined);

export interface WikiResearchFilters {
  query: string;
  tier: number | null;
  troopLine: TroopLine | null;
  data: DataFilter;
}

export const tiersOfNodes = (nodes: ResearchNode[]) =>
  [...new Set(nodes.map((node) => node.tier))].sort((a, b) => a - b);

export const filterWikiNodes = (
  nodes: ResearchNode[],
  filters: WikiResearchFilters,
) => {
  const query = filters.query.trim().toLowerCase();

  return nodes.filter(
    (node) =>
      (!query ||
        node.name.toLowerCase().includes(query) ||
        node.levels.some((level) =>
          bonusText(level).toLowerCase().includes(query),
        )) &&
      (filters.tier === null || node.tier === filters.tier) &&
      (filters.troopLine === null || troopLineOf(node) === filters.troopLine) &&
      (filters.data === "all" ||
        (filters.data === "placeholders"
          ? isPlaceholder(node)
          : hasMissingTime(node))),
  );
};

export type Requirement =
  | { kind: "building"; name: string; level: string }
  | { kind: "research"; name: string; level: number };

export const requirementsOf = (
  node: ResearchNode,
  levelIndex: number,
): Requirement[] =>
  node.levels[levelIndex].prerequisites.map((requirement) =>
    requirement.type === "building"
      ? {
          kind: "building",
          name: findBuildingById(requirement.id)?.name ?? requirement.id,
          level: String(requirement.level),
        }
      : {
          kind: "research",
          name: findResearch(requirement.id)?.name ?? requirement.id,
          level: Number(requirement.level),
        },
  );

/** A placeholder capstone stores a time of 0 without a real upgrade, so its time is unknown. */
export const timeOfLevel = (node: ResearchNode, level: ResearchLevel) =>
  isPlaceholder(node) ? undefined : level.researchTimeSeconds;

const T12_TREE_IDS: Record<TroopLine, string> = {
  Infantry: "t12-infantry",
  Marksman: "t12-marksman",
  Lancer: "t12-lancer",
};

/** The package tree tabs that draw one Wiki tab. T12 draws one tree for each troop type. */
export const treeTabsOfWikiTab = (
  tab: WikiResearchTabId,
  troopLine: TroopLine | null,
): { treeTabId: string; troopLine: TroopLine | null }[] => {
  if (tab === "t11")
    return [{ treeTabId: "war-academy-troops", troopLine: null }];
  if (tab === "t12") {
    const lines = troopLine ? [troopLine] : TROOP_LINES;
    return lines.map((line) => ({
      treeTabId: T12_TREE_IDS[line],
      troopLine: line,
    }));
  }
  return [{ treeTabId: tab, troopLine: null }];
};
