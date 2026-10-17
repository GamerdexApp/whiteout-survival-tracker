import type { Item, ItemCategory } from "whiteout-survival-data";
import { allItems } from "@/data/game/items";

export type ItemCategoryFilter = ItemCategory | "all";
export type SourcesFilter = "any" | "has" | "none";
export type LootRatesFilter = "any" | "has";

export interface ItemFilters {
  query: string;
  category: ItemCategoryFilter;
  sources: SourcesFilter;
  lootRates: LootRatesFilter;
}

export const NO_FILTERS: ItemFilters = {
  query: "",
  category: "all",
  sources: "any",
  lootRates: "any",
};

export const hasSources = (item: Item) => item.sources.length > 0;
export const hasLootRates = (item: Item) => (item.rewardRates?.length ?? 0) > 0;

export const itemsWithoutSources = () =>
  allItems.filter((item) => !hasSources(item)).length;
export const chestsWithLootRates = () =>
  allItems.filter((item) => item.category === "Chest" && hasLootRates(item))
    .length;

export const filterItems = (filters: ItemFilters) => {
  const needle = filters.query.trim().toLowerCase();
  return allItems.filter((item) => {
    if (filters.category !== "all" && item.category !== filters.category)
      return false;
    if (filters.sources === "has" && !hasSources(item)) return false;
    if (filters.sources === "none" && hasSources(item)) return false;
    if (filters.lootRates === "has" && !hasLootRates(item)) return false;
    if (!needle) return true;
    return `${item.name} ${item.description ?? ""}`
      .toLowerCase()
      .includes(needle);
  });
};
