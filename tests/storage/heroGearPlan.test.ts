import { describe, expect, it } from "vitest";
import type { HeroGearSet } from "@/types/app";
import {
  gearPlanChecks,
  planResourceName,
  runGearPlan,
  slotIds,
} from "@/service/heroGear";
import { forgingRows } from "@/data/game/heroGear";
import { emptyChief, withInventory } from "./fixtures";

const piece = (enhancement = 0) => ({
  quality: "mythic" as const,
  enhancement,
  empowerment: 0,
  forging: null,
});

const set: HeroGearSet = {
  id: "set-1",
  name: "Test set",
  troopType: "infantry",
  pieces: Object.fromEntries(slotIds.map((slot) => [slot, piece()])),
} as HeroGearSet;

const plan = (inventory: Record<string, number>) => {
  const chief = withInventory(
    { ...emptyChief(), heroGear: { sets: [set] } },
    inventory,
  );
  const refs = [{ setId: set.id, slot: slotIds[0] }];
  const goals = {
    [set.id]: {
      [slotIds[0]]: {
        ...piece(100),
        empowerment: 5,
        forging: forgingRows[forgingRows.length - 1].id,
      },
    },
  };
  return { chief, result: runGearPlan(chief, refs, goals) };
};

describe("hero gear plan stock", () => {
  it("counts components and gear as Enhancement XP at their value", () => {
    const { chief, result } = plan({
      "enhancement-xp-component-10": 2,
      "enhancement-xp-component-100": 3,
      "common-hero-gear": 4,
      "epic-hero-gear": 5,
    });
    const check = gearPlanChecks(result, chief).find(
      (item) => item.id === "enhancement-xp",
    )!;

    expect(check.available).toBe(20 + 300 + 40 + 750);
    expect(check.needed).toBe(result.resources.get("enhancement-xp"));
    expect(check.name).toBe("Enhancement XP");
  });

  it("counts Mythic Hero Gear and chests together, gear first", () => {
    const { chief, result } = plan({
      "custom-mythic-hero-gear-chest": 2,
      "mythic-hero-gear": 3,
    });
    const check = gearPlanChecks(result, chief).find(
      (item) => item.id === "custom-mythic-hero-gear-chest",
    )!;

    expect(check.available).toBe(5);
    expect(check.name).toBe("Mythic Hero Gear / Custom Mythic Hero Gear Chest");
    expect(check.detail).toBe(
      "Mythic Hero Gear 3 · Custom Mythic Hero Gear Chest 2",
    );
  });

  it("leaves other resources on their own count", () => {
    const { chief, result } = plan({ "essence-stones": 7 });
    const check = gearPlanChecks(result, chief).find(
      (item) => item.id === "essence-stones",
    )!;

    expect(check.available).toBe(7);
    expect(check.detail).toBeUndefined();
    expect(planResourceName("essence-stones")).toBe("Essence Stones");
  });
});
