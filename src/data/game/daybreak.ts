import {
  DAYBREAK_ISLAND_TIMBERMILL,
  DAYBREAK_ISLAND_UNLOCK_FURNACE_LEVEL,
  decoration,
  lumberCamp,
  treeOfLife,
} from "whiteout-survival-data";
import type {
  Decoration,
  DecorationCategory,
  LumberCampLevel,
  TreeOfLifeLevel,
} from "whiteout-survival-data";

export { DAYBREAK_ISLAND_TIMBERMILL, DAYBREAK_ISLAND_UNLOCK_FURNACE_LEVEL };

export const allDecorations: Decoration[] = decoration().get();
export const lumberCampLevels: LumberCampLevel[] = lumberCamp().get();
export const treeOfLifeLevels: TreeOfLifeLevel[] = treeOfLife().get();

export const findDecoration = (id: string) => decoration().find(id);

export const decorationCategories: DecorationCategory[] = [
  "Basic",
  "Vegetation",
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Mythic",
  "Unique",
];

export const decorationsOfCategory = (category: DecorationCategory) =>
  decoration().byCategory(category).get();
