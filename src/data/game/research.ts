import { formatNumber, translator } from "@/i18n/formatter";
import {
  research,
  RESEARCH_TREE_LAYOUT,
  researchTree,
} from "whiteout-survival-data";
import type {
  ResearchCategory,
  ResearchLevel,
  ResearchNode,
  ResearchQueue,
} from "whiteout-survival-data";
import { unlockDayOfKey } from "./serverTimeline";

export const allResearch: ResearchNode[] = research().get();

export const findResearch = (id: string) => research().find(id);

export const treeTabs = researchTree();

export const treeLayout = RESEARCH_TREE_LAYOUT;

export type ResearchTabId =
  | "growth"
  | "economy"
  | "battle"
  | "war-academy-troops"
  | "t12-infantry"
  | "t12-marksman"
  | "t12-lancer";

export interface ResearchTab {
  id: ResearchTabId;
  categories: ResearchCategory[];
  queue: ResearchQueue;
  /** The server age in days at which the tab opens, or null when it is always open. */
  unlockDays: number | null;
}

export const WAR_ACADEMY_UNLOCK_DAYS = unlockDayOfKey("war-academy");
export const T12_UNLOCK_DAYS = unlockDayOfKey("t12-research");

export const tabName = (tab: ResearchTab) =>
  translator("research")(`tabs.${tab.id}`);

export const researchTabs: ResearchTab[] = [
  {
    id: "growth",
    categories: ["Growth"],
    queue: "main",
    unlockDays: null,
  },
  {
    id: "economy",
    categories: ["Economy"],
    queue: "main",
    unlockDays: null,
  },
  {
    id: "battle",
    categories: ["Battle"],
    queue: "main",
    unlockDays: null,
  },
  {
    id: "war-academy-troops",
    categories: ["T11 Infantry", "T11 Marksman", "T11 Lancer"],
    queue: "warAcademy",
    unlockDays: WAR_ACADEMY_UNLOCK_DAYS,
  },
  {
    id: "t12-infantry",
    categories: ["T12 Infantry"],
    queue: "warAcademy",
    unlockDays: T12_UNLOCK_DAYS,
  },
  {
    id: "t12-marksman",
    categories: ["T12 Marksman"],
    queue: "warAcademy",
    unlockDays: T12_UNLOCK_DAYS,
  },
  {
    id: "t12-lancer",
    categories: ["T12 Lancer"],
    queue: "warAcademy",
    unlockDays: T12_UNLOCK_DAYS,
  },
];

export const tabOfNode = (node: ResearchNode) =>
  researchTabs.find((tab) =>
    tab.categories.includes(node.category),
  ) as ResearchTab;

export const nodesOfTab = (tab: ResearchTab) =>
  allResearch.filter((node) => tab.categories.includes(node.category));

export const maxLevelOf = (node: ResearchNode) => node.levels.length;

export const levelData = (
  node: ResearchNode,
  level: number,
): ResearchLevel | undefined => node.levels[level - 1];

/**
 * The tier of a node is its position inside its own category. T11 and T12 nodes read as the troop
 * line and the tier, for example Infantry T2.
 */
export const troopLineOf = (node: ResearchNode) => {
  const match = /^T1[12] (\w+)$/.exec(node.category);
  return match ? match[1] : null;
};

export const tierLabel = (node: ResearchNode) => {
  const line = troopLineOf(node);
  const t = translator("research");
  const tier = formatNumber(node.tier);
  return line ? t("tier.troopLine", { line, tier }) : t("tier.plain", { tier });
};

export const isPlaceholder = (node: ResearchNode) =>
  node.levels.every((level) => level.cost.length === 0);

/**
 * How deep a node sits in the tree: the longest chain of research requirements above it. Roots are
 * 0. The grid lists nodes by this depth and then by package order.
 */
const depthById = new Map<string, number>();

const depthOf = (node: ResearchNode): number => {
  const known = depthById.get(node.id);
  if (known !== undefined) return known;

  depthById.set(node.id, 0);
  const parents = new Set(
    node.levels.flatMap((level) =>
      level.prerequisites
        .filter((requirement) => requirement.type === "research")
        .map((requirement) => requirement.id),
    ),
  );
  const depth = [...parents].reduce((deepest, id) => {
    const parent = findResearch(id);
    return parent && parent.id !== node.id
      ? Math.max(deepest, depthOf(parent) + 1)
      : deepest;
  }, 0);
  depthById.set(node.id, depth);
  return depth;
};

const packageOrder = new Map(
  allResearch.map((node, index) => [node.id, index]),
);

export const gameOrder = (a: ResearchNode, b: ResearchNode) =>
  depthOf(a) - depthOf(b) ||
  (packageOrder.get(a.id) as number) - (packageOrder.get(b.id) as number);
