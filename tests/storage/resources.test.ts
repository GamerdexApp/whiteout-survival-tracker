import { describe, expect, it } from "vitest";
import {
  AFFINITY_GIFT_ITEM_IDS,
  BASE_RESOURCE_IDS,
  chestRows,
  CHIEF_CHARM_ITEM_IDS,
  CHIEF_GEAR_AND_CHARM_CHEST_ITEM_IDS,
  CHIEF_GEAR_ITEM_IDS,
  COMMON_EXPERT_ITEM_IDS,
  EXPEDITION_MANUALS,
  EXPERT_SIGILS,
  EXPLORATION_MANUALS,
  FIRE_CRYSTAL_ITEM_IDS,
  GENERAL_HERO_SHARDS,
  HERO_GEAR_CHEST_ITEM_IDS,
  HERO_GEAR_ITEM_IDS,
  HERO_GEAR_MATERIAL_ITEM_IDS,
  OTHER_ITEM_IDS,
  packRows,
  PET_ADVANCEMENT_ITEM_IDS,
  PET_FOOD_AND_MARK_ITEM_IDS,
  speedupRows,
} from "@/service/coreResources";
import { researchChecks, resourceChecks } from "@/service/planStock";
import {
  anyResourcePossible,
  enhancementXpOwned,
  expertTotals,
  resourceStocks,
  resourceTotalOf,
  resourceTotals,
} from "@/service/resourceTotals";
import { findItem } from "@/data/game/items";
import { emptyChief, withInventory } from "./fixtures";

const everyItemId = () => [
  ...packRows.flatMap((row) => row.cells.map((cell) => cell.itemId)),
  ...chestRows.flatMap((row) => row.cells.map((cell) => cell.itemId)),
  ...speedupRows.flatMap((row) => row.cells.map((cell) => cell.itemId)),
  ...BASE_RESOURCE_IDS,
  ...FIRE_CRYSTAL_ITEM_IDS,
  ...EXPERT_SIGILS.map((sigil) => sigil.itemId),
  ...AFFINITY_GIFT_ITEM_IDS,
  ...COMMON_EXPERT_ITEM_IDS,
  ...PET_ADVANCEMENT_ITEM_IDS,
  ...PET_FOOD_AND_MARK_ITEM_IDS,
  ...HERO_GEAR_MATERIAL_ITEM_IDS,
  ...HERO_GEAR_ITEM_IDS,
  ...HERO_GEAR_CHEST_ITEM_IDS,
  ...OTHER_ITEM_IDS,
  ...CHIEF_GEAR_ITEM_IDS,
  ...CHIEF_CHARM_ITEM_IDS,
  ...CHIEF_GEAR_AND_CHARM_CHEST_ITEM_IDS,
  ...GENERAL_HERO_SHARDS.map((shard) => shard.itemId),
  ...EXPEDITION_MANUALS.map((manual) => manual.itemId),
  ...EXPLORATION_MANUALS.map((manual) => manual.itemId),
];

describe("core resource rows", () => {
  it("point at items the data package has", () => {
    const missing = everyItemId().filter((itemId) => !findItem(itemId));

    expect(missing).toEqual([]);
  });

  it("gives Coal and Iron a 100 pack and no secured 100 pack", () => {
    const sizes = (resourceId: string, secured: boolean) =>
      packRows
        .find(
          (row) => row.resourceId === resourceId && row.secured === secured,
        )!
        .cells.map((cell) => cell.size);

    expect(sizes("meat", false)).toEqual([1_000, 10_000, 100_000, 1_000_000]);
    expect(sizes("coal", false)).toEqual([
      100, 1_000, 10_000, 100_000, 1_000_000,
    ]);
    expect(sizes("iron", true)).toEqual([1_000, 10_000, 100_000, 1_000_000]);
  });

  it("lists every speedup type with its durations in order", () => {
    const general = speedupRows.find((row) => row.type === "general")!;

    expect(general.cells.map((cell) => cell.minutes)).toEqual([
      1, 5, 60, 180, 480,
    ]);
    expect(speedupRows).toHaveLength(6);
  });
});

describe("resource totals", () => {
  it("adds the loose count, the packs and the secured packs", () => {
    const chief = withInventory(emptyChief(), {
      meat: 500,
      "meat-10k": 3,
      "meat-1k-secured": 2,
      "coal-100": 7,
    });

    expect(resourceTotalOf(chief, "meat")).toEqual({
      resourceId: "meat",
      loose: 500,
      packs: 30_000,
      securedPacks: 2_000,
      total: 32_500,
    });
    expect(resourceTotalOf(chief, "coal").total).toBe(700);
    expect(resourceTotals(chief).map((entry) => entry.resourceId)).toEqual([
      "meat",
      "wood",
      "coal",
      "iron",
    ]);
  });
});

describe("any resource chests", () => {
  it("counts the secured chests with the same amounts as the plain ones", () => {
    const chief = withInventory(emptyChief(), {
      "lv-1-custom-resource-chest": 30_000,
      "lv-1-custom-secured-resource-chest": 50_000,
      "lv-2-custom-resource-chest": 40_000,
      "lv-3-custom-resource-chest": 1_000,
      "lv-3-custom-secured-resource-chest": 2_000,
    });
    const possible = Object.fromEntries(
      anyResourcePossible(chief).map((entry) => [
        entry.resourceId,
        entry.amount,
      ]),
    );

    expect(possible.meat).toBe(7_800_000_000);
    expect(possible.wood).toBe(possible.meat);
    expect(possible.coal).toBe(1_560_000_000);
    expect(possible.iron).toBe(390_000_000);
  });

  it("is 0 when no chest is held", () => {
    expect(
      anyResourcePossible(emptyChief()).every((entry) => entry.amount === 0),
    ).toBe(true);
  });
});

describe("expert totals", () => {
  it("values the gifts at +10, +100 and +1,000 affinity", () => {
    const chief = withInventory(emptyChief(), {
      compass: 7,
      "fiery-heart": 8,
      "sail-of-conquest": 9,
      "common-expert-sigil": 10,
      "book-of-knowledge": 11,
    });
    const totals = expertTotals(chief);

    expect(totals.affinity).toBe(9_870);
    expect(totals.commonSigils).toBe(10);
    expect(totals.books).toBe(11);
    expect(totals.gifts.map((gift) => gift.count)).toEqual([7, 8, 9]);
  });
});

describe("enhancement XP owned", () => {
  it("is zero for a chief with no items", () => {
    expect(enhancementXpOwned(emptyChief())).toBe(0);
  });

  it("adds components at their size and gear at its XP", () => {
    const chief = withInventory(emptyChief(), {
      "enhancement-xp-component-10": 2,
      "enhancement-xp-component-100": 3,
      "common-hero-gear": 4,
      "uncommon-hero-gear": 5,
      "rare-hero-gear": 6,
      "epic-hero-gear": 7,
      "mythic-hero-gear": 8,
    });

    expect(enhancementXpOwned(chief)).toBe(20 + 300 + 40 + 150 + 360 + 1050);
  });
});

describe("resource stock with packs and chests", () => {
  it("counts loose stock and packs", () => {
    const chief = withInventory(emptyChief(), {
      meat: 1_000,
      "meat-10k": 2,
      "meat-100k-secured": 1,
    });

    expect(resourceStocks(chief, {}).meat.available).toBe(121_000);
    expect(resourceStocks(chief, {}).meat.packs).toBe(120_000);
  });

  it("opens chests for what is short, the smallest chest that fits last", () => {
    const chief = withInventory(emptyChief(), {
      "lv-1-custom-resource-chest": 4,
      "lv-2-custom-resource-chest": 1,
    });
    const iron = resourceStocks(chief, { iron: 5_200 }).iron;

    expect(iron.fromChests).toBe(5_500);
    expect(iron.chestsUsed).toBe(2);
    expect(iron.available).toBe(5_500);
  });

  it("counts a Secured chest like a normal one", () => {
    const chief = withInventory(emptyChief(), {
      "lv-1-custom-secured-resource-chest": 1,
    });

    expect(resourceStocks(chief, { meat: 10_000 }).meat.available).toBe(10_000);
  });

  it("shares the chests between the resources, Iron first", () => {
    const chief = withInventory(emptyChief(), {
      "lv-1-custom-resource-chest": 1,
    });
    const stocks = resourceStocks(chief, { iron: 500, meat: 10_000 });

    expect(stocks.iron.available).toBe(500);
    expect(stocks.meat.available).toBe(0);
  });

  it("leaves the chests alone when nothing is short", () => {
    const chief = withInventory(emptyChief(), {
      meat: 5_000,
      "lv-3-custom-resource-chest": 3,
    });
    const meat = resourceStocks(chief, { meat: 4_000 }).meat;

    expect(meat.fromChests).toBe(0);
    expect(meat.available).toBe(5_000);
  });

  it("tells the plan check where the stock comes from", () => {
    const chief = withInventory(emptyChief(), {
      "coal-10k": 1,
      "lv-1-custom-resource-chest": 3,
    });
    const checks = resourceChecks(
      {
        resources: [{ itemId: "coal", amount: 14_000 }],
        speedupMinutesNeeded: 0,
      } as never,
      chief,
    );
    const coal = checks.find((check) => check.id === "coal")!;
    const meat = checks.find((check) => check.id === "meat")!;

    expect(coal.available).toBe(14_000);
    expect(coal.detail).toBe(
      "Includes 10,000 from backpack packs and 4,000 from Custom Resource Chests.",
    );
    expect(meat.detail).toBeUndefined();
  });
});

describe("plan stock order", () => {
  it("lists Meat, Wood, Coal and Iron first, in that order", () => {
    const needs = ["iron", "refined-fire-crystal", "wood", "meat", "coal"].map(
      (itemId) => ({ itemId, amount: 1 }),
    );
    const checks = researchChecks(
      { resources: needs, speedupMinutesNeeded: 0 } as never,
      emptyChief(),
    );

    expect(checks.slice(0, 5).map((check) => check.id)).toEqual([
      "meat",
      "wood",
      "coal",
      "iron",
      "refined-fire-crystal",
    ]);
    expect(
      resourceChecks(
        { resources: [], speedupMinutesNeeded: 0 } as never,
        emptyChief(),
      )
        .slice(0, 4)
        .map((check) => check.id),
    ).toEqual(["meat", "wood", "coal", "iron"]);
  });
});
