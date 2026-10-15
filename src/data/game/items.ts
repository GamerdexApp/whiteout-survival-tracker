import { items } from "whiteout-survival-data";
import type { Item, ItemCategory, SpeedupType } from "whiteout-survival-data";

export const allItems: Item[] = items().get();

export const findItem = (itemId: string) => items().find(itemId);

export const RESOURCE_ITEM_IDS = [
  "wood",
  "coal",
  "iron",
  "meat",
  "fire-crystal",
  "refined-fire-crystal",
];

export const STOCK_STRIP_ITEM_IDS = [
  "meat",
  "wood",
  "coal",
  "iron",
  "steel",
  "fire-crystal",
  "gems",
];

/**
 * The base resources count in tens of thousands, so their plus and minus buttons step by 10,000.
 */
export const LARGE_STEP_ITEM_IDS = ["meat", "wood", "coal", "iron", "steel"];

export const itemCategories: { category: ItemCategory; count: number }[] =
  Object.entries(
    allItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([category, count]) => ({ category: category as ItemCategory, count }))
    .sort((a, b) => b.count - a.count);

export const speedupTypes: { type: SpeedupType; label: string }[] = [
  { type: "general", label: "General" },
  { type: "construction", label: "Construction" },
  { type: "troop", label: "Troop training" },
  { type: "research", label: "Research" },
  { type: "learning", label: "Learning" },
  { type: "healing", label: "Healing" },
];
