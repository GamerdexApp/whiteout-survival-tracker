import type { SpeedupType } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
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
  label: string;
  minutes: number;
  parts: { name: string; count: number }[];
}

/**
 * The minutes of speedups on hand for each type, added up from the owned counts.
 */
export const speedupStock = (chief: Playthrough): SpeedupStock[] =>
  speedupTypes.map(({ type, label }) => {
    const owned = allItems
      .filter((item) => item.speedup?.type === type)
      .map((item) => ({ item, count: ownedCount(chief, item.id) }))
      .filter(({ count }) => count > 0);
    return {
      type,
      label,
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

/**
 * General speedups work on construction, so a construction plan counts both.
 */
export const constructionSpeedupMinutes = (chief: Playthrough) =>
  speedupStock(chief)
    .filter(({ type }) => type === "construction" || type === "general")
    .reduce((sum, stock) => sum + stock.minutes, 0);
