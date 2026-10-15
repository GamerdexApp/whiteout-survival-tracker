import { items } from "whiteout-survival-data";

export const findItem = (itemId: string) => items().find(itemId);

export const RESOURCE_ITEM_IDS = [
  "wood",
  "coal",
  "iron",
  "meat",
  "fire-crystal",
  "refined-fire-crystal",
];
