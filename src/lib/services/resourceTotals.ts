import type { Playthrough } from "@/types/app";
import { ENHANCEMENT_XP_SOURCES } from "@/data/game/heroGear";
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

/** The resource that the chests go to first is the one that is hardest to collect. */
const CHEST_ALLOCATION_ORDER: readonly BaseResourceId[] = [
  "iron",
  "coal",
  "wood",
  "meat",
];

export interface ResourceStock {
  /** Loose stock, backpack packs and Secured packs. */
  inHand: number;
  packs: number;
  fromChests: number;
  chestsUsed: number;
  available: number;
}

const chestsHeldByLevel = (chief: Playthrough) => {
  const held: Record<number, number> = {};
  chestRows
    .flatMap((row) => row.cells)
    .forEach((cell) => {
      held[cell.level] =
        (held[cell.level] ?? 0) + ownedCount(chief, cell.itemId);
    });
  return held;
};

/**
 * Opens held chests as one resource until the shortage is covered or no chest is left. A chest
 * that covers what is left on its own is the smallest one that does. Otherwise the largest chests
 * go first.
 */
const coverWithChests = (
  resourceId: BaseResourceId,
  shortBy: number,
  held: Record<number, number>,
) => {
  let remaining = shortBy;
  let amount = 0;
  let chests = 0;
  while (remaining > 0) {
    const levels = Object.keys(held)
      .map(Number)
      .filter((level) => held[level] > 0)
      .sort(
        (a, b) =>
          CHEST_PICK_AMOUNTS[a][resourceId] - CHEST_PICK_AMOUNTS[b][resourceId],
      );
    if (levels.length === 0) break;
    const fits = levels.find(
      (level) => CHEST_PICK_AMOUNTS[level][resourceId] >= remaining,
    );
    const level = fits ?? levels[levels.length - 1];
    const pick = CHEST_PICK_AMOUNTS[level][resourceId];
    const take = fits ? 1 : Math.min(held[level], Math.floor(remaining / pick));
    held[level] -= take;
    remaining -= take * pick;
    amount += take * pick;
    chests += take;
  }
  return { amount, chests };
};

/**
 * What the chief can spend of each base resource: the loose stock and the packs, then the Custom
 * Resource chests for what a plan still needs. Each chest opens as one resource, so the chests are
 * shared between the resources.
 */
export const resourceStocks = (
  chief: Playthrough,
  needs: Partial<Record<BaseResourceId, number>>,
): Record<BaseResourceId, ResourceStock> => {
  const held = chestsHeldByLevel(chief);
  const stocks = Object.fromEntries(
    BASE_RESOURCE_IDS.map((resourceId) => {
      const { loose, packs, securedPacks, total } = resourceTotalOf(
        chief,
        resourceId,
      );
      return [
        resourceId,
        {
          inHand: total,
          packs: packs + securedPacks,
          fromChests: 0,
          chestsUsed: 0,
          available: loose + packs + securedPacks,
        },
      ];
    }),
  ) as Record<BaseResourceId, ResourceStock>;
  CHEST_ALLOCATION_ORDER.forEach((resourceId) => {
    const shortBy = (needs[resourceId] ?? 0) - stocks[resourceId].inHand;
    if (shortBy <= 0) return;
    const { amount, chests } = coverWithChests(resourceId, shortBy, held);
    stocks[resourceId].fromChests = amount;
    stocks[resourceId].chestsUsed = chests;
    stocks[resourceId].available += amount;
  });
  return stocks;
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

export const enhancementXpOwned = (chief: Playthrough) =>
  ENHANCEMENT_XP_SOURCES.reduce(
    (sum, source) => sum + ownedCount(chief, source.itemId) * source.value,
    0,
  );
