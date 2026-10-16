import type { BuffDecoration } from "whiteout-survival-data";
import type {
  Decoration,
  DecorationCategory,
  DecorationLevel,
} from "whiteout-survival-data";
import type {
  DaybreakDecorationState,
  DaybreakState,
  Playthrough,
} from "@/types/app";
import { furnace } from "@/data/game/buildings";
import {
  allDecorations,
  DAYBREAK_ISLAND_UNLOCK_FURNACE_LEVEL,
  lumberCampLevels,
  treeOfLifeLevels,
} from "@/data/game/daybreak";
import { levelOrder } from "./buildings";

export const MAX_ISLAND_LEVEL = lumberCampLevels.length;
export const MAX_TREE_LEVEL = treeOfLifeLevels.length;

/** A decoration the chief can own more than once keeps a count. One that has a limit of 1 does not. */
export const isCounted = (decoration: Decoration) =>
  (decoration.limit ?? 1) > 1;

export const isLevelled = (decoration: Decoration) =>
  (decoration.levels?.length ?? 0) > 0;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const unlockFurnaceLabel = String(DAYBREAK_ISLAND_UNLOCK_FURNACE_LEVEL);

export const furnaceLevelsMissing = (chief: Playthrough) =>
  Math.max(
    0,
    levelOrder(furnace, unlockFurnaceLabel) -
      levelOrder(furnace, chief.buildings?.furnace?.level),
  );

export const islandUnlocked = (chief: Playthrough) =>
  furnaceLevelsMissing(chief) === 0;

export const chiefFurnaceLevel = (chief: Playthrough) =>
  chief.buildings?.furnace?.level ?? undefined;

export const lumberCampLevelOf = (chief: Playthrough) =>
  clamp(chief.daybreak?.lumberCamp ?? 1, 1, MAX_ISLAND_LEVEL);

export const treeOfLifeLevelOf = (chief: Playthrough) =>
  clamp(chief.daybreak?.treeOfLife ?? 1, 1, MAX_TREE_LEVEL);

export interface LumberCampView {
  level: number;
  current: (typeof lumberCampLevels)[number];
  next: (typeof lumberCampLevels)[number] | undefined;
  treeLevel: number;
  treeTooLow: boolean;
}

export const buildLumberCampView = (chief: Playthrough): LumberCampView => {
  const level = lumberCampLevelOf(chief);
  const current = lumberCampLevels[level - 1];
  const treeLevel = treeOfLifeLevelOf(chief);
  return {
    level,
    current,
    next: lumberCampLevels[level],
    treeLevel,
    treeTooLow: treeLevel < current.treeOfLifeLevelRequired,
  };
};

export interface TreeOfLifeView {
  level: number;
  current: (typeof treeOfLifeLevels)[number];
  next: (typeof treeOfLifeLevels)[number] | undefined;
  buffKnown: boolean;
}

export const buildTreeOfLifeView = (chief: Playthrough): TreeOfLifeView => {
  const level = treeOfLifeLevelOf(chief);
  const current = treeOfLifeLevels[level - 1];
  return {
    level,
    current,
    next: treeOfLifeLevels[level],
    buffKnown: current.buff.stat !== "",
  };
};

export interface BuffText {
  stat: string;
  value: string;
}

const buffOf = (level: DecorationLevel | undefined): BuffText | null =>
  level && level.buff.stat !== ""
    ? { stat: level.buff.stat, value: level.buff.value }
    : null;

export interface DecorationView {
  decoration: Decoration;
  owned: boolean;
  level: number;
  maxLevel: number;
  count: number;
  buffAtLevel: BuffText | null;
  buffAtMax: BuffText | null;
  prosperityAtMax: number | undefined;
  hasKnownBuff: boolean;
}

const maxCountOf = (decoration: Decoration) => decoration.limit ?? 1;

export const buildDecorationView = (
  decoration: Decoration,
  state: DaybreakDecorationState | undefined,
): DecorationView => {
  const levels = decoration.levels ?? [];
  const maxLevel = levels.length;
  const owned = state?.owned === true;
  const level = maxLevel === 0 ? 0 : clamp(state?.level ?? 1, 1, maxLevel);
  const count = owned ? clamp(state?.count ?? 1, 1, maxCountOf(decoration)) : 0;
  return {
    decoration,
    owned,
    level,
    maxLevel,
    count,
    buffAtLevel: buffOf(levels[level - 1]),
    buffAtMax: buffOf(levels[maxLevel - 1]),
    prosperityAtMax:
      levels[maxLevel - 1]?.prosperity ?? decoration.prosperityAtMaxLevel,
    hasKnownBuff: levels.some((entry) => entry.buff.stat !== ""),
  };
};

export const buildDecorationViews = (chief: Playthrough) =>
  allDecorations.map((decoration) =>
    buildDecorationView(
      decoration,
      chief.daybreak?.decorations?.[decoration.id],
    ),
  );

export const countOwned = (views: DecorationView[]) =>
  views.filter((view) => view.owned).length;

export type DecorationOrder = "game" | "name" | "level";

export interface DecorationFilters {
  search: string;
  category: "all" | DecorationCategory;
  ownedOnly: boolean;
  /** Owned only and not owned only never hold at the same time. */
  notOwnedOnly: boolean;
  limitedOnly: boolean;
  /** Limited only and non limited only never hold at the same time. */
  nonLimitedOnly: boolean;
  unknownBuffOnly: boolean;
  order: DecorationOrder;
}

export const defaultDecorationFilters = (): DecorationFilters => ({
  search: "",
  category: "all",
  ownedOnly: false,
  notOwnedOnly: false,
  limitedOnly: false,
  nonLimitedOnly: false,
  unknownBuffOnly: false,
  order: "game",
});

export const countDecorationFilters = (filters: DecorationFilters) =>
  [
    filters.category !== "all",
    filters.ownedOnly,
    filters.notOwnedOnly,
    filters.limitedOnly,
    filters.nonLimitedOnly,
    filters.unknownBuffOnly,
    filters.order !== "game",
  ].filter(Boolean).length;

const levelSortKey = (view: DecorationView) => (view.owned ? view.level : 0);

export const filterDecorationViews = (
  views: DecorationView[],
  filters: DecorationFilters,
) => {
  const search = filters.search.trim().toLowerCase();
  const kept = views.filter(
    (view) =>
      (search === "" || view.decoration.name.toLowerCase().includes(search)) &&
      (filters.category === "all" ||
        view.decoration.category === filters.category) &&
      (!filters.ownedOnly || view.owned) &&
      (!filters.notOwnedOnly || !view.owned) &&
      (!filters.limitedOnly || view.decoration.limited === true) &&
      (!filters.nonLimitedOnly || view.decoration.limited !== true) &&
      (!filters.unknownBuffOnly || !view.hasKnownBuff),
  );
  if (filters.order === "name") {
    return [...kept].sort((a, b) =>
      a.decoration.name.localeCompare(b.decoration.name),
    );
  }
  if (filters.order === "level") {
    return [...kept].sort((a, b) => levelSortKey(b) - levelSortKey(a));
  }
  return kept;
};

export const categoryCounts = (views: DecorationView[]) => {
  const counts = new Map<DecorationCategory, number>();
  for (const view of views) {
    counts.set(
      view.decoration.category,
      (counts.get(view.decoration.category) ?? 0) + 1,
    );
  }
  return counts;
};

const withDaybreak = (
  chief: Playthrough,
  patch: Partial<DaybreakState>,
): Playthrough => ({
  ...chief,
  daybreak: { ...chief.daybreak, ...patch },
});

export const withLumberCamp = (chief: Playthrough, level: number) =>
  withDaybreak(chief, { lumberCamp: clamp(level, 1, MAX_ISLAND_LEVEL) });

export const withTreeOfLife = (chief: Playthrough, level: number) =>
  withDaybreak(chief, { treeOfLife: clamp(level, 1, MAX_TREE_LEVEL) });

export const withDecoration = (
  chief: Playthrough,
  id: string,
  patch: DaybreakDecorationState,
) =>
  withDaybreak(chief, {
    decorations: {
      ...chief.daybreak?.decorations,
      [id]: { ...chief.daybreak?.decorations?.[id], ...patch },
    },
  });

/**
 * The profile fields that `calculateBuffs` reads for Daybreak Island. Only owned decorations with
 * levels are listed, because a decoration without levels has no buff in the package. Nothing is
 * listed while the island is locked.
 */
export const daybreakBuffInputs = (
  chief: Playthrough,
): { decorations: BuffDecoration[]; treeOfLifeLevel?: number } => {
  if (!islandUnlocked(chief)) return { decorations: [] };
  const decorations = buildDecorationViews(chief)
    .filter((view) => view.owned && view.maxLevel > 0)
    .map((view) => ({ id: view.decoration.id, level: view.level }));
  const saved = chief.daybreak?.treeOfLife;
  return saved !== undefined && saved > 0
    ? { decorations, treeOfLifeLevel: clamp(saved, 1, MAX_TREE_LEVEL) }
    : { decorations };
};

/**
 * The prosperity of a levelled decoration at a level. The package gives it for every level. When
 * it does not, it is the prosperity at the top level divided by the number of levels, times the
 * level.
 */
const levelProsperity = (decoration: Decoration, level: number) => {
  const levels = decoration.levels ?? [];
  const given = levels[level - 1]?.prosperity;
  if (given !== undefined) return given;
  return decoration.prosperityAtMaxLevel === undefined || levels.length === 0
    ? undefined
    : (decoration.prosperityAtMaxLevel / levels.length) * level;
};

export interface ProsperitySummary {
  now: number;
  max: number;
  /** Prosperity of the levelled decorations owned, at the level reached. */
  levelledNow: number;
  levelledMax: number;
  /** Prosperity of the decorations with a limit: the count owned times the prosperity of one. */
  limitedNow: number;
  limitedMax: number;
  /** Owned decorations that have no prosperity value in the package. They add nothing. */
  ownedWithoutValue: number;
}

/**
 * The prosperity score of the chief. A levelled decoration gives the prosperity of its level. A
 * decoration with only a prosperity at max gives that value for each one owned, so the most it can
 * give is its limit times that value. The Basic and Vegetation decorations have no value.
 */
export const summarizeProsperity = (
  views: DecorationView[],
): ProsperitySummary => {
  const summary: ProsperitySummary = {
    now: 0,
    max: 0,
    levelledNow: 0,
    levelledMax: 0,
    limitedNow: 0,
    limitedMax: 0,
    ownedWithoutValue: 0,
  };
  for (const view of views) {
    const { decoration } = view;
    if (view.maxLevel > 0) {
      const max = levelProsperity(decoration, view.maxLevel);
      if (max === undefined) continue;
      summary.levelledMax += max;
      if (view.owned)
        summary.levelledNow += levelProsperity(decoration, view.level) ?? 0;
    } else if (decoration.prosperityAtMaxLevel !== undefined) {
      const each = decoration.prosperityAtMaxLevel;
      summary.limitedMax += (decoration.limit ?? 1) * each;
      summary.limitedNow += view.count * each;
    } else if (view.owned) {
      summary.ownedWithoutValue += 1;
    }
  }
  summary.now = summary.levelledNow + summary.limitedNow;
  summary.max = summary.levelledMax + summary.limitedMax;
  return summary;
};
