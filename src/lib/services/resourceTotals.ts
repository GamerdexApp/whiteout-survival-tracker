import type { Playthrough } from "@/types/app";
import {
  AFFINITY_GIFT_ITEM_IDS,
  BASE_RESOURCE_IDS,
  chestRows,
  packRows,
} from "./coreResources";
import type { BaseResourceId } from "./coreResources";
import { ownedCount } from "./inventory";

export interface ResourceTotal {
  resourceId: BaseResourceId;
  loose: number;
  packs: number;
  securedPacks: number;
  total: number;
}

export const resourceTotalOf = (
  chief: Playthrough,
  resourceId: BaseResourceId,
): ResourceTotal => {
  const packsOf = (secured: boolean) =>
    packRows
      .filter((row) => row.resourceId === resourceId && row.secured === secured)
      .flatMap((row) => row.cells)
      .reduce(
        (sum, cell) => sum + ownedCount(chief, cell.itemId) * cell.size,
        0,
      );
  const loose = ownedCount(chief, resourceId);
  const packs = packsOf(false);
  const securedPacks = packsOf(true);
  return {
    resourceId,
    loose,
    packs,
    securedPacks,
    total: loose + packs + securedPacks,
  };
};

export const resourceTotals = (chief: Playthrough): ResourceTotal[] =>
  BASE_RESOURCE_IDS.map((resourceId) => resourceTotalOf(chief, resourceId));

/**
 * What one Custom Resource chest grants per pick. A Secured chest grants the same amounts. The
 * Lv.2 Meat amount is 100K although the data package description states 10K.
 */
const CHEST_PICK_AMOUNTS: Record<number, Record<BaseResourceId, number>> = {
  1: { meat: 10_000, wood: 10_000, coal: 2_000, iron: 500 },
  2: { meat: 100_000, wood: 100_000, coal: 20_000, iron: 5_000 },
  3: { meat: 1_000_000, wood: 1_000_000, coal: 200_000, iron: 50_000 },
};

/**
 * The most each resource can reach if every Custom Resource chest, Secured included, is opened as that resource.
 */
export const anyResourcePossible = (
  chief: Playthrough,
): { resourceId: BaseResourceId; amount: number }[] => {
  const cells = chestRows.flatMap((row) => row.cells);
  return BASE_RESOURCE_IDS.map((resourceId) => ({
    resourceId,
    amount: cells.reduce(
      (sum, cell) =>
        sum +
        ownedCount(chief, cell.itemId) *
          CHEST_PICK_AMOUNTS[cell.level][resourceId],
      0,
    ),
  }));
};

const AFFINITY_PER_GIFT: Record<
  (typeof AFFINITY_GIFT_ITEM_IDS)[number],
  number
> = {
  compass: 10,
  "fiery-heart": 100,
  "sail-of-conquest": 1_000,
};

export interface ExpertTotals {
  commonSigils: number;
  books: number;
  affinity: number;
  gifts: { itemId: string; count: number }[];
}

export const expertTotals = (chief: Playthrough): ExpertTotals => {
  const gifts = AFFINITY_GIFT_ITEM_IDS.map((itemId) => ({
    itemId,
    count: ownedCount(chief, itemId),
  }));
  return {
    commonSigils: ownedCount(chief, "common-expert-sigil"),
    books: ownedCount(chief, "book-of-knowledge"),
    affinity: gifts.reduce(
      (sum, gift) => sum + gift.count * AFFINITY_PER_GIFT[gift.itemId],
      0,
    ),
    gifts,
  };
};
