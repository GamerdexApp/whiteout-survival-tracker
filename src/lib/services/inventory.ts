import type { SpeedupType } from "whiteout-survival-data";
import type { GeneralSpeedupUse, Playthrough } from "@/types/app";
import { allItems, LARGE_STEP_ITEM_IDS, speedupTypes } from "@/data/game/items";

export const MAX_COUNT = 999_999_999_999;

export const ownedCount = (chief: Playthrough, itemId: string) =>
  chief.inventory?.[itemId] ?? 0;

const clampCount = (count: number) =>
  Math.min(
    MAX_COUNT,
    Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)),
  );

/**
 * A count of 0 removes the key, so the saved file only holds what the chief owns.
 */
export const withOwnedCounts = (
  chief: Playthrough,
  counts: Record<string, number>,
): Playthrough => {
  const inventory = { ...chief.inventory };
  Object.entries(counts).forEach(([itemId, count]) => {
    const value = clampCount(count);
    if (value === 0) delete inventory[itemId];
    else inventory[itemId] = value;
  });
  return { ...chief, inventory };
};

export const withOwnedCount = (
  chief: Playthrough,
  itemId: string,
  count: number,
) => withOwnedCounts(chief, { [itemId]: count });

export const stepFor = (itemId: string) =>
  LARGE_STEP_ITEM_IDS.includes(itemId) ? 10_000 : 1;

export interface SpeedupStock {
  type: SpeedupType;
  minutes: number;
  parts: { name: string; count: number }[];
}

/**
 * The minutes of speedups on hand for each type, added up from the owned counts.
 */
export const speedupStock = (chief: Playthrough): SpeedupStock[] =>
  speedupTypes.map((type) => {
    const owned = allItems
      .filter((item) => item.speedup?.type === type)
      .map((item) => ({ item, count: ownedCount(chief, item.id) }))
      .filter(({ count }) => count > 0);
    return {
      type,
      minutes: owned.reduce(
        (sum, { item, count }) => sum + item.speedup!.minutes * count,
        0,
      ),
      parts: owned.map(({ item, count }) => ({
        name: item.name.split(" ")[0],
        count,
      })),
    };
  });

export const GENERAL_SPEEDUP_USES: readonly GeneralSpeedupUse[] = [
  "buildings",
  "research",
  "troops",
  "experts",
];

/** The percent of the general speedup minutes that a plan may use. It is 0 until one is set. */
export const generalSharePercent = (
  chief: Playthrough,
  use: GeneralSpeedupUse,
) => chief.generalSpeedupShare?.[use] ?? 0;

/** The most one plan can take: what the other plans leave of the 100 percent. */
export const maxGeneralShare = (chief: Playthrough, use: GeneralSpeedupUse) =>
  100 -
  GENERAL_SPEEDUP_USES.filter((other) => other !== use).reduce(
    (sum, other) => sum + generalSharePercent(chief, other),
    0,
  );

/** Sets the share of one plan. The shares of all plans stay at 100 percent or less. */
export const withGeneralShare = (
  chief: Playthrough,
  use: GeneralSpeedupUse,
  percent: number,
): Playthrough => {
  const clean = Math.min(
    maxGeneralShare(chief, use),
    Math.max(0, Math.floor(Number.isFinite(percent) ? percent : 0)),
  );
  return {
    ...chief,
    generalSpeedupShare: { ...chief.generalSpeedupShare, [use]: clean },
  };
};

/** The general speedup minutes that a plan applies, whole minutes of its share. */
export const generalMinutesApplied = (
  chief: Playthrough,
  use: GeneralSpeedupUse,
) =>
  Math.floor(
    (minutesOfSpeedup(chief, "general") * generalSharePercent(chief, use)) /
      100,
  );

/**
 * A construction plan counts the construction speedups and its share of the general speedups.
 */
export const constructionSpeedupMinutes = (chief: Playthrough) =>
  minutesOfSpeedup(chief, "construction") +
  generalMinutesApplied(chief, "buildings");

/**
 * A research plan counts the research speedups and its share of the general speedups.
 */
export const researchSpeedupMinutes = (chief: Playthrough) =>
  minutesOfSpeedup(chief, "research") +
  generalMinutesApplied(chief, "research");

export const minutesOfSpeedup = (chief: Playthrough, type: SpeedupType) =>
  speedupStock(chief).find((stock) => stock.type === type)?.minutes ?? 0;
