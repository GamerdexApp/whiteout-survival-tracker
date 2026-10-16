import { formatNumber, translator } from "@/i18n/formatter";
import type {
  ResearchLevel,
  ResearchNode,
  ResearchRequirement,
} from "whiteout-survival-data";
import type { Playthrough, ResearchJob } from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import type { ResearchTab } from "@/data/game/research";
import {
  allResearch,
  findResearch,
  gameOrder,
  isPlaceholder,
  levelData,
  maxLevelOf,
  nodesOfTab,
  tabName,
  tabOfNode,
  troopLineOf,
} from "@/data/game/research";
import { levelOrder } from "./buildings";
import { serverAgeDays } from "./serverAge";
import { isWarAcademyOpenOnDay } from "./unlocks";

const MS_PER_DAY = 86_400_000;

export { serverAgeDays };

export const researchLevelOf = (chief: Playthrough, nodeId: string) =>
  chief.research?.[nodeId]?.level ?? 0;

/**
 * Returns the saved level when the node has such a level. A level from an edited save that is
 * above the top level reads as the top level.
 */
const clampedLevel = (node: ResearchNode, level: number) =>
  Math.min(maxLevelOf(node), Math.max(0, Math.floor(level)));

export const levelOfNode = (chief: Playthrough, node: ResearchNode) =>
  clampedLevel(node, researchLevelOf(chief, node.id));

export const goalOfNode = (chief: Playthrough, node: ResearchNode) =>
  clampedLevel(node, chief.researchPlan?.goals?.[node.id] ?? 0);

export const researchJobFor = (
  chief: Playthrough,
  nodeId: string,
): ResearchJob | undefined =>
  chief.queues?.research?.find((job) => job.nodeId === nodeId);

export interface RequirementStatus {
  type: ResearchRequirement["type"];
  text: string;
  yours: string;
  met: boolean;
}

/**
 * Reads one requirement of a level against the chief. Building requirements compare by the order
 * of the level in the package. A research requirement needs that node at the stated level.
 */
export const requirementStatus = (
  requirement: ResearchRequirement,
  chief: Playthrough,
): RequirementStatus => {
  const t = translator("research");

  if (requirement.type === "building") {
    const building = findBuildingById(requirement.id);
    const required = String(requirement.level);
    const yours = chief.buildings?.[requirement.id]?.level ?? null;
    return {
      type: "building",
      text: `${building?.name ?? requirement.id} ${required}`,
      yours: yours
        ? t("requirement.yours", { level: yours })
        : t("requirement.notBuilt"),
      met: building
        ? levelOrder(building, yours) >= levelOrder(building, required)
        : true,
    };
  }

  if (requirement.type === "research") {
    const needed = findResearch(requirement.id);
    const have = researchLevelOf(chief, requirement.id);
    return {
      type: "research",
      text: t("requirement.researchLevel", {
        name: needed?.name ?? requirement.id,
        level: formatNumber(Number(requirement.level)),
      }),
      yours: t("requirement.yoursLevel", { level: formatNumber(have) }),
      met: have >= Number(requirement.level),
    };
  }

  return {
    type: requirement.type,
    text: t("requirement.notReleased", { id: requirement.id }),
    yours: "",
    met: false,
  };
};

export const unmetRequirementsOf = (level: ResearchLevel, chief: Playthrough) =>
  level.prerequisites
    .map((requirement) => requirementStatus(requirement, chief))
    .filter((status) => !status.met);

/**
 * The highest level the chief can reach from `fromLevel` now. Every level on the way needs its
 * requirements met, so one blocked level stops the climb.
 */
export const reachableLevelOf = (
  node: ResearchNode,
  fromLevel: number,
  chief: Playthrough,
) => {
  let reached = fromLevel;
  for (const level of node.levels.filter((item) => item.level > fromLevel)) {
    if (unmetRequirementsOf(level, chief).length > 0) break;
    reached = level.level;
  }
  return reached;
};

export interface TabLock {
  required: number;
  yours: number | null;
}

/**
 * A tab is locked by server age when its unlock age has not passed. A chief with no server start
 * date has an unknown age, so those tabs stay locked.
 */
export const tabLockOf = (
  tab: ResearchTab,
  chief: Playthrough,
): TabLock | null => {
  if (tab.unlockDays === null) return null;
  return isWarAcademyOpenOnDay(chief, tab.unlockDays)
    ? null
    : { required: tab.unlockDays, yours: serverAgeDays(chief) };
};

export const tabLockText = (tab: ResearchTab, lock: TabLock) => {
  const t = translator("research");
  const values = { tab: tabName(tab), days: formatNumber(lock.required) };
  return lock.yours === null
    ? t("tabLock.unknownAge", values)
    : t("tabLock.knownAge", { ...values, yours: formatNumber(lock.yours) });
};

export interface ResearchNodeView {
  node: ResearchNode;
  tab: ResearchTab;
  level: number;
  goal: number;
  max: number;
  maxed: boolean;
  hasGoal: boolean;
  placeholder: boolean;
  progress: number;
  next: ResearchLevel | undefined;
  tabLock: TabLock | null;
  lockedBy: string | null;
  blockedBy: string[];
  reachable: number;
  locked: boolean;
  job: ResearchJob | undefined;
}

export const buildNodeView = (
  node: ResearchNode,
  chief: Playthrough,
): ResearchNodeView => {
  const tab = tabOfNode(node);
  const level = levelOfNode(chief, node);
  const goal = goalOfNode(chief, node);
  const max = maxLevelOf(node);
  const next = levelData(node, level + 1);
  const unmet = next ? unmetRequirementsOf(next, chief) : [];
  const tabLock = tabLockOf(tab, chief);
  const buildingGate = unmet.find((status) => status.type === "building");
  const lockedBy = level === 0 && buildingGate ? buildingGate.text : null;

  return {
    node,
    tab,
    level,
    goal,
    max,
    maxed: level === max,
    hasGoal: goal > level,
    placeholder: isPlaceholder(node),
    progress: level / max,
    next,
    tabLock,
    lockedBy,
    blockedBy: unmet.map((status) => status.text),
    reachable: reachableLevelOf(node, level, chief),
    locked: tabLock !== null || lockedBy !== null,
    job: researchJobFor(chief, node.id),
  };
};

export const buildAllNodeViews = (chief: Playthrough) =>
  allResearch.map((node) => buildNodeView(node, chief));

export const bonusText = (level: ResearchLevel) =>
  level.bonus
    .map((bonus) =>
      bonus.statKey ? `${bonus.stat} ${bonus.value}` : bonus.value,
    )
    .join(", ");

export interface ResearchSummary {
  maxed: number;
  total: number;
  power: number;
  withoutTime: number;
  locked: number;
}

/**
 * The power of every researched level of a node.
 */
export const researchedPowerOf = (view: ResearchNodeView) =>
  view.node.levels
    .filter((level) => level.level <= view.level)
    .reduce((sum, level) => sum + level.power, 0);

export const powerOfViews = (views: ResearchNodeView[]) =>
  views.reduce((sum, view) => sum + researchedPowerOf(view), 0);

export const summarizeResearch = (
  views: ResearchNodeView[],
): ResearchSummary => ({
  maxed: views.filter((view) => view.maxed).length,
  total: views.length,
  power: powerOfViews(views),
  withoutTime: views.filter((view) =>
    view.node.levels.some((level) => level.researchTimeSeconds === undefined),
  ).length,
  locked: views.filter((view) => view.locked).length,
});

export type ResearchStatus =
  "all" | "progress" | "goal" | "maxed" | "locked" | "notStarted";

export type ResearchOrder = "game" | "name" | "level";

export interface ResearchFilters {
  search: string;
  tier: number | "all";
  status: ResearchStatus;
  troopLine: string | "all";
  order: ResearchOrder;
}

export const defaultResearchFilters = (): ResearchFilters => ({
  search: "",
  tier: "all",
  status: "all",
  troopLine: "all",
  order: "game",
});

const statusMatches = (view: ResearchNodeView, status: ResearchStatus) => {
  switch (status) {
    case "progress":
      return view.level > 0 && !view.maxed;
    case "goal":
      return view.hasGoal;
    case "maxed":
      return view.maxed;
    case "locked":
      return view.locked;
    case "notStarted":
      return view.level === 0;
    default:
      return true;
  }
};

const orderers: Record<
  ResearchOrder,
  (a: ResearchNodeView, b: ResearchNodeView) => number
> = {
  game: (a, b) => gameOrder(a.node, b.node),
  name: (a, b) => a.node.name.localeCompare(b.node.name),
  level: (a, b) => b.level - a.level || gameOrder(a.node, b.node),
};

export const filterNodeViews = (
  views: ResearchNodeView[],
  filters: ResearchFilters,
) => {
  const query = filters.search.trim().toLowerCase();
  return views
    .filter(
      (view) =>
        (filters.tier === "all" || view.node.tier === filters.tier) &&
        (filters.troopLine === "all" ||
          troopLineOf(view.node) === filters.troopLine) &&
        statusMatches(view, filters.status) &&
        (query === "" ||
          view.node.name.toLowerCase().includes(query) ||
          view.node.levels.some((level) =>
            bonusText(level).toLowerCase().includes(query),
          )),
    )
    .sort(orderers[filters.order]);
};

export const countResearchFilters = (filters: ResearchFilters) =>
  [
    filters.tier !== "all",
    filters.status !== "all",
    filters.troopLine !== "all",
    filters.order !== "game",
  ].filter(Boolean).length;

export const viewsOfTab = (views: ResearchNodeView[], tab: ResearchTab) =>
  views.filter((view) => view.tab.id === tab.id);

export const nodesOfTabCount = (tab: ResearchTab) => nodesOfTab(tab).length;

export const withResearchLevel = (
  chief: Playthrough,
  nodeId: string,
  level: number,
): Playthrough => {
  const research = { ...chief.research };
  if (level <= 0) delete research[nodeId];
  else research[nodeId] = { level };
  return { ...chief, research };
};

export const withResearchLevels = (
  chief: Playthrough,
  levels: Record<string, number>,
): Playthrough =>
  Object.entries(levels).reduce(
    (current, [nodeId, level]) => withResearchLevel(current, nodeId, level),
    chief,
  );
