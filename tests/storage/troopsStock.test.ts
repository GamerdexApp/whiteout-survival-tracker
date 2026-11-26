import { describe, expect, it } from "vitest";
import {
  newRun,
  promotableOf,
  promotionCapacity,
  runCapacityOf,
  runLimitOf,
  runTroopsPlan,
  troopsStockChecks,
} from "@/service/troopsPlan";
import type { TroopsPlanDraft } from "@/service/troopsPlan";
import { veteranChief, withInventory } from "./fixtures";

const draftFor = (chief: ReturnType<typeof veteranChief>): TroopsPlanDraft => ({
  runs: [newRun(chief, "infantry", "training")],
  position: "none",
  rank: "regular",
  capacityBoost: false,
  mobilize: false,
  advancedTraining: false,
});

describe("troops plan stock", () => {
  const chief = withInventory(veteranChief(), {
    meat: 1_000,
    "wood-10k": 1,
    "lv-1-custom-resource-chest": 2,
  });
  const result = runTroopsPlan(chief, draftFor(chief));
  const checks = troopsStockChecks(chief, result);

  it("lists Meat, Wood, Coal and Iron, then the training time", () => {
    expect(checks.map((check) => check.id)).toEqual([
      "meat",
      "wood",
      "coal",
      "iron",
      "troop-time",
    ]);
  });

  it("takes the amounts the plan needs from the calculation", () => {
    result.calculation.resources.forEach((resource) => {
      expect(checks.find((check) => check.id === resource.itemId)!.needed).toBe(
        resource.amount,
      );
    });
  });

  it("counts packs and chests like the buildings plan", () => {
    const wood = checks.find((check) => check.id === "wood")!;

    expect(wood.available).toBeGreaterThanOrEqual(10_000);
    expect(wood.detail).toContain("from backpack packs");
  });
});

describe("promotion batch capacity", () => {
  it("grows by the target tier time over the step time", () => {
    expect(promotionCapacity(627, "infantry", 10, 11)).toBe(4_031);
    expect(promotionCapacity(627, "infantry", 9, 10)).toBe(4_539);
    expect(promotionCapacity(627, "infantry", 9, 12)).toBe(1_605);
  });

  it("is the training capacity for a step that takes no time", () => {
    expect(promotionCapacity(627, "infantry", 12, 12)).toBe(627);
  });

  it("leaves a training run at the training capacity", () => {
    const chief = veteranChief();

    expect(runCapacityOf(newRun(chief, "infantry", "training"), 627)).toBe(627);
    expect(runCapacityOf(promotion(9, 10, "max"), 627)).toBe(4_539);
  });
});

const promotion = (
  fromTier: number,
  toTier: number,
  count: number | "max",
  batches = 1,
) => ({
  camp: "infantry" as const,
  mode: "promotion" as const,
  fromTier,
  toTier,
  count,
  batches,
});

const holding = (held: number) => ({
  ...veteranChief(),
  troops: { infantry: { counts: { "9": held } } },
});

const promotedTo10 = (held: number, count: number | "max", batches = 1) => {
  const chief = holding(held);
  const result = runTroopsPlan(chief, {
    ...draftFor(chief),
    runs: [promotion(9, 10, count, batches)],
  });
  return { chief, result, run: promotion(9, 10, count, batches) };
};

describe("promotion limited by the troops held", () => {
  it("reads the troops held at the tier that the run promotes from", () => {
    const chief = holding(250);

    expect(promotableOf(chief, promotion(9, 10, "max"))).toBe(250);
    expect(promotableOf(chief, promotion(8, 10, "max"))).toBe(0);
    expect(
      promotableOf(chief, newRun(chief, "infantry", "training")),
    ).toBeNull();
  });

  it("promotes only the troops held on Max when that is below the promotion capacity", () => {
    const { result } = promotedTo10(100, "max");

    expect(result.calculation.tiers[9].infantry).toBe(100);
    expect(result.calculation.tiers[8].infantry).toBe(-100);
  });

  it("fills a promotion batch to the promotion capacity when enough troops are held", () => {
    const { result } = promotedTo10(10_000_000, "max");
    const capacity = result.calculation.capacity;
    const expected = promotionCapacity(capacity, "infantry", 9, 10);

    expect(result.calculation.tiers[9].infantry).toBe(expected);
    expect(expected).toBeGreaterThan(capacity);
  });

  it("cuts a count above the troops held", () => {
    const { result } = promotedTo10(100, 5_000);

    expect(result.calculation.tiers[9].infantry).toBe(100);
  });

  it("promotes nothing when no troops are held at the lower tier", () => {
    const { result, chief, run } = promotedTo10(0, "max");

    expect(result.calculation.tiers[9].infantry).toBe(0);
    expect(runLimitOf(chief, run, result.calculation.capacity)).toBe(0);
  });

  it("leaves a training run alone", () => {
    const chief = veteranChief();
    const run = newRun(chief, "infantry", "training");

    expect(runLimitOf(chief, run, 627)).toBe(627);
  });
});
