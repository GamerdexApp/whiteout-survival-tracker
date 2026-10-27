import type { SpeedupType } from "whiteout-survival-data";
import { allItems, speedupTypes } from "@/data/game/items";

export const BASE_RESOURCE_IDS = ["meat", "wood", "coal", "iron"] as const;

export const FIRE_CRYSTAL_ITEM_IDS = [
  "fire-crystal",
  "fire-crystal-shard",
  "refined-fire-crystal",
] as const;

export type BaseResourceId = (typeof BASE_RESOURCE_IDS)[number];

export interface PackCell {
  itemId: string;
  size: number;
}

export interface PackRow {
  resourceId: BaseResourceId;
  secured: boolean;
  cells: PackCell[];
}

const PACK_SIZES = [1_000, 10_000, 100_000, 1_000_000];
const SMALL_PACK_SIZE = 100;
const RESOURCES_WITH_SMALL_PACK: readonly BaseResourceId[] = ["coal", "iron"];

const sizeId = (size: number) =>
  size >= 1_000_000 ? "1m" : size >= 1_000 ? `${size / 1_000}k` : String(size);

const packRowOf = (resourceId: BaseResourceId, secured: boolean): PackRow => {
  const hasSmallPack =
    !secured && RESOURCES_WITH_SMALL_PACK.includes(resourceId);
  const sizes = hasSmallPack ? [SMALL_PACK_SIZE, ...PACK_SIZES] : PACK_SIZES;
  return {
    resourceId,
    secured,
    cells: sizes.map((size) => ({
      itemId: `${resourceId}-${sizeId(size)}${secured ? "-secured" : ""}`,
      size,
    })),
  };
};

/** The backpack packs of each base resource, each followed by its Secured row. */
export const packRows: PackRow[] = BASE_RESOURCE_IDS.flatMap((resourceId) => [
  packRowOf(resourceId, false),
  packRowOf(resourceId, true),
]);

export interface ChestCell {
  itemId: string;
  level: number;
}

export interface ChestRow {
  secured: boolean;
  cells: ChestCell[];
}

const CHEST_LEVELS = [1, 2, 3];

const chestRowOf = (secured: boolean): ChestRow => ({
  secured,
  cells: CHEST_LEVELS.map((level) => ({
    itemId: `lv-${level}-custom-${secured ? "secured-" : ""}resource-chest`,
    level,
  })),
});

export const chestRows: ChestRow[] = [chestRowOf(false), chestRowOf(true)];

export interface SpeedupCell {
  itemId: string;
  minutes: number;
}

export interface SpeedupRow {
  type: SpeedupType;
  cells: SpeedupCell[];
}

export const speedupRows: SpeedupRow[] = speedupTypes.map((type) => ({
  type,
  cells: allItems
    .filter((item) => item.speedup?.type === type)
    .map((item) => ({ itemId: item.id, minutes: item.speedup!.minutes }))
    .sort((a, b) => a.minutes - b.minutes),
}));

export const EXPERT_SIGILS = [
  { itemId: "cyrille-sigil", expertId: "cyrille" },
  { itemId: "agnes-sigil", expertId: "agnes" },
  { itemId: "holger-sigil", expertId: "holger" },
  { itemId: "romulus-sigil", expertId: "romulus" },
  { itemId: "fabian-sigil", expertId: "fabian" },
  { itemId: "baldurs-sigil", expertId: "baldur" },
  { itemId: "valeria-sigil", expertId: "valeria" },
  { itemId: "ronne-sigil", expertId: "ronne" },
  { itemId: "kathy-sigil", expertId: "kathy" },
  { itemId: "gareth-sigil", expertId: "gareth" },
] as const;

export const AFFINITY_GIFT_ITEM_IDS = [
  "compass",
  "fiery-heart",
  "sail-of-conquest",
] as const;

export const COMMON_EXPERT_ITEM_IDS = [
  "common-expert-sigil",
  "book-of-knowledge",
] as const;
