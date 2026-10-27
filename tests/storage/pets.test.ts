import { describe, expect, it } from "vitest";
import type { Playthrough } from "@/types/app";
import { chestUseOf, petPlanChecks, runPetPlan } from "@/service/pets";
import { veteranChief, withInventory } from "./fixtures";

const ADVANCEMENT_CHEST = "pet-advancement-materials-custom-chest";

const planFor = (inventory: Record<string, number>) => {
  const chief: Playthrough = withInventory(
    { ...veteranChief(), pets: { "cave-hyena": { unlocked: true, level: 1 } } },
    inventory,
  );
  const plan = runPetPlan(chief, {
    "cave-hyena": { level: 50, advanceAtGoal: true },
  });
  return { chief, plan };
};

const check = (checks: ReturnType<typeof petPlanChecks>, id: string) =>
  checks.find((item) => item.id === id)!;

describe("pet plan needs", () => {
  it("counts pet food, taming manuals, energizing potions and strengthening serums", () => {
    const { plan } = planFor({});

    expect(plan.needs).toEqual({
      "pet-food": 28_875,
      "taming-manual": 240,
      "energizing-potion": 60,
      "strengthening-serum": 10,
    });
  });
});

describe("pet advancement chests", () => {
  const held = {
    "taming-manual": 3,
    "energizing-potion": 1,
    "strengthening-serum": 2,
  };

  it("gives a held chest to the strengthening serums first", () => {
    const { chief, plan } = planFor({ ...held, [ADVANCEMENT_CHEST]: 5 });
    const use = chestUseOf(plan, chief);

    expect(use.chestsFor["strengthening-serum"]).toBe(5);
    expect(use.chestsFor["energizing-potion"]).toBe(0);
    expect(use.chestsFor["taming-manual"]).toBe(0);
    expect(use.fullyUsed).toBe(true);
  });

  it("goes on to the energizing potions, then the taming manuals", () => {
    const { chief, plan } = planFor({ ...held, [ADVANCEMENT_CHEST]: 20 });
    const use = chestUseOf(plan, chief);

    // The serums are short by 8 and need 8 chests. The potions are short by 59 and take the rest.
    expect(use.chestsFor["strengthening-serum"]).toBe(8);
    expect(use.chestsFor["energizing-potion"]).toBe(12);
    expect(use.chestsFor["taming-manual"]).toBe(0);
    expect(use.used).toBe(20);
  });

  it("leaves the extra chests unused when the shortage is covered", () => {
    const { chief, plan } = planFor({ ...held, [ADVANCEMENT_CHEST]: 500 });
    const use = chestUseOf(plan, chief);

    expect(use.chestsFor).toEqual({
      "strengthening-serum": 8,
      "energizing-potion": 30,
      "taming-manual": 34,
    });
    expect(use.used).toBe(72);
    expect(use.held).toBe(500);
    expect(use.fullyUsed).toBe(false);
  });

  it("uses no chest when none is held", () => {
    const { chief, plan } = planFor(held);
    const use = chestUseOf(plan, chief);

    expect(use.used).toBe(0);
    expect(use.fullyUsed).toBe(false);
  });

  it("counts what the chests give as available, per item", () => {
    const { chief, plan } = planFor({ ...held, [ADVANCEMENT_CHEST]: 20 });
    const checks = petPlanChecks(plan, chief);

    // 8 chests give 8 serums. 12 chests give 24 potions. The manuals get none.
    expect(check(checks, "strengthening-serum").available).toBe(10);
    expect(check(checks, "energizing-potion").available).toBe(25);
    expect(check(checks, "taming-manual").available).toBe(3);
    expect(check(checks, "energizing-potion").detail).toBeTruthy();
    expect(check(checks, "taming-manual").detail).toBeUndefined();
  });

  it("does not add a check row for the chest, because the chests are extra", () => {
    const { chief, plan } = planFor({ ...held, [ADVANCEMENT_CHEST]: 20 });

    expect(
      petPlanChecks(plan, chief).some((item) => item.id === ADVANCEMENT_CHEST),
    ).toBe(false);
  });

  it("never fills pet food from a chest", () => {
    const { chief, plan } = planFor({ [ADVANCEMENT_CHEST]: 500 });
    const food = check(petPlanChecks(plan, chief), "pet-food");

    expect(food.available).toBe(0);
    expect(food.needed).toBe(28_875);
  });
});
