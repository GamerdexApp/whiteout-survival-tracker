import type { Decoration, DecorationCategory } from "whiteout-survival-data";
import { allDecorations, decorationCategories } from "@/data/game/daybreak";

export type DecorationCostKind =
  "lifeEssence" | "items" | "limited" | "unknown";
export type DecorationCostFilter = DecorationCostKind | "any";
export type DecorationCategoryFilter = DecorationCategory | "all";

export const COST_FILTER_IDS: DecorationCostFilter[] = [
  "any",
  "lifeEssence",
  "items",
  "limited",
  "unknown",
];

export const decorationCostKind = (
  decoration: Decoration,
): DecorationCostKind => {
  if (decoration.lifeEssenceCost) return "lifeEssence";
  if (decoration.cost?.length) return "items";
  if (decoration.limited) return "limited";
  return "unknown";
};

export const maxLevelOf = (decoration: Decoration) => decoration.levels?.at(-1);

export const buffTextOf = (buff: { stat: string; value: string }) =>
  buff.stat ? `${buff.stat} ${buff.value}` : undefined;

export const categoryCounts = () =>
  decorationCategories.map((category) => ({
    category,
    count: allDecorations.filter(
      (decoration) => decoration.category === category,
    ).length,
  }));

export const filterDecorations = (
  query: string,
  category: DecorationCategoryFilter,
  cost: DecorationCostFilter,
) => {
  const needle = query.trim().toLowerCase();
  return allDecorations.filter((decoration) => {
    if (category !== "all" && decoration.category !== category) return false;
    if (cost !== "any" && decorationCostKind(decoration) !== cost) return false;
    if (!needle) return true;
    const maxBuff = maxLevelOf(decoration)?.buff;
    const haystack = `${decoration.name} ${maxBuff?.stat ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
};
