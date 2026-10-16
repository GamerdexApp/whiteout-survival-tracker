import type { AllianceTechNode } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { techNodes } from "@/data/game/alliance";

export type TechStatus = "maxed" | "inProgress" | "notStarted" | "locked";

export interface TechRequirement {
  nodeId: string;
  nodeName: string;
  level: number;
  have: number;
  met: boolean;
}

export interface TechCost {
  itemId: string;
  amount: number;
}

export interface TechView {
  node: AllianceTechNode;
  level: number;
  maxLevel: number;
  status: TechStatus;
  /** The bonus text at the current level. Null at level 0. */
  bonusNow: string | null;
  bonusAtMax: string | null;
  /** The cost, time and needs of the next level. Null when the node is at its top level. */
  next: {
    level: number;
    cost: TechCost[];
    timeSeconds: number;
    requirements: TechRequirement[];
  } | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const techLevelOf = (chief: Playthrough, node: AllianceTechNode) =>
  clamp(
    Math.trunc(chief.allianceTech?.[node.id]?.level ?? 0),
    0,
    node.levels.length,
  );

const nameOf = (id: string) =>
  techNodes.find((node) => node.id === id)?.name ?? id;

const requirementsOf = (
  chief: Playthrough,
  level: AllianceTechNode["levels"][number],
): TechRequirement[] =>
  level.prerequisites.map((requirement) => {
    const other = techNodes.find((node) => node.id === requirement.id);
    const have = other ? techLevelOf(chief, other) : 0;
    return {
      nodeId: requirement.id,
      nodeName: nameOf(requirement.id),
      level: requirement.level,
      have,
      met: have >= requirement.level,
    };
  });

export const requirementsMet = (requirements: TechRequirement[]) =>
  requirements.every((requirement) => requirement.met);

const statusOf = (
  level: number,
  node: AllianceTechNode,
  firstLevelMet: boolean,
): TechStatus => {
  if (level >= node.levels.length) return "maxed";
  if (level > 0) return "inProgress";
  return firstLevelMet ? "notStarted" : "locked";
};

export const buildTechView = (
  chief: Playthrough,
  node: AllianceTechNode,
): TechView => {
  const level = techLevelOf(chief, node);
  const nextLevel = node.levels[level];
  const firstLevelMet = requirementsMet(requirementsOf(chief, node.levels[0]));
  return {
    node,
    level,
    maxLevel: node.levels.length,
    status: statusOf(level, node, firstLevelMet),
    bonusNow: level > 0 ? (node.levels[level - 1].bonus ?? null) : null,
    bonusAtMax: node.levels[node.levels.length - 1].bonus ?? null,
    next: nextLevel
      ? {
          level: nextLevel.level,
          cost: nextLevel.cost,
          timeSeconds: nextLevel.timeSeconds,
          requirements: requirementsOf(chief, nextLevel),
        }
      : null,
  };
};

export const buildTechViews = (chief: Playthrough): TechView[] =>
  techNodes
    .map((node) => buildTechView(chief, node))
    .sort(
      (a, b) =>
        a.node.tier - b.node.tier || a.node.name.localeCompare(b.node.name),
    );

export interface TechCounts {
  total: number;
  maxed: number;
  inProgress: number;
  notStarted: number;
  locked: number;
}

export const countTech = (views: TechView[]): TechCounts => ({
  total: views.length,
  maxed: views.filter((view) => view.status === "maxed").length,
  inProgress: views.filter((view) => view.status === "inProgress").length,
  notStarted: views.filter((view) => view.status === "notStarted").length,
  locked: views.filter((view) => view.status === "locked").length,
});

export const allTechCounts = (chief: Playthrough) =>
  countTech(buildTechViews(chief));

export const withTechLevel = (
  chief: Playthrough,
  nodeId: string,
  level: number,
): Playthrough => {
  const node = techNodes.find((item) => item.id === nodeId);
  if (!node) return chief;
  return {
    ...chief,
    allianceTech: {
      ...chief.allianceTech,
      [nodeId]: { level: clamp(Math.trunc(level), 0, node.levels.length) },
    },
  };
};

export interface RequiredBy {
  nodeId: string;
  nodeName: string;
  category: string;
  tier: number;
  /** The lowest level of the other node that needs this node. */
  fromLevel: number;
  /** The level of this node that it needs there. */
  needsLevel: number;
}

/** The nodes whose levels list this node as a prerequisite. */
export const requiredByOf = (nodeId: string): RequiredBy[] =>
  techNodes.flatMap((other) => {
    for (const level of other.levels) {
      const needs = level.prerequisites.find(
        (requirement) => requirement.id === nodeId,
      );
      if (needs) {
        return [
          {
            nodeId: other.id,
            nodeName: other.name,
            category: other.category,
            tier: other.tier,
            fromLevel: level.level,
            needsLevel: needs.level,
          },
        ];
      }
    }
    return [];
  });

export interface RemainingToMax {
  cost: TechCost[];
  timeSeconds: number;
}

/** The cost and time of every level above the current one, summed from the package. */
export const remainingToMax = (view: TechView): RemainingToMax => {
  const totals = new Map<string, number>();
  let timeSeconds = 0;
  for (const level of view.node.levels.slice(view.level)) {
    timeSeconds += level.timeSeconds;
    for (const line of level.cost) {
      totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + line.amount);
    }
  }
  return {
    cost: [...totals].map(([itemId, amount]) => ({ itemId, amount })),
    timeSeconds,
  };
};

export interface TechFilters {
  search: string;
  tier: number | "all";
  status: TechStatus | "all";
}

export const defaultTechFilters = (): TechFilters => ({
  search: "",
  tier: "all",
  status: "all",
});

export const countTechFilters = (filters: TechFilters) =>
  (filters.tier === "all" ? 0 : 1) + (filters.status === "all" ? 0 : 1);

export const filterTechViews = (
  views: TechView[],
  category: string,
  filters: TechFilters,
) => {
  const search = filters.search.trim().toLowerCase();
  return views.filter(
    (view) =>
      view.node.category === category &&
      (filters.tier === "all" || view.node.tier === filters.tier) &&
      (filters.status === "all" || view.status === filters.status) &&
      (search === "" || view.node.name.toLowerCase().includes(search)),
  );
};
