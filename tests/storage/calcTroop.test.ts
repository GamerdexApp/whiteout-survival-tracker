import { describe, expect, it } from "vitest";
import {
  initialTroopCalculatorState,
  runTroopCalculator,
} from "@/service/calcTroop";
import { promotionCapacity } from "@/service/troopsPlan";

const stateWithPromotion = (count: number | "max", boost = false) => {
  const state = initialTroopCalculatorState();
  return {
    ...state,
    capacityBoost: boost,
    researchCapacity: 100,
    camps: {
      ...state.camps,
      infantry: {
        ...state.camps.infantry,
        mode: "promotion" as const,
        promotion: { fromTier: 9, toTier: 10, count, batches: 1 },
      },
    },
  };
};

describe("troop calculator promotion batches", () => {
  it("fills a promotion batch to the promotion capacity on Max", () => {
    const result = runTroopCalculator(stateWithPromotion("max"));
    const expected = promotionCapacity(result.capacity, "infantry", 9, 10);

    expect(result.tiers[9].infantry).toBe(expected);
    expect(expected).toBeGreaterThan(result.capacity);
  });

  it("reports the training capacity, also with the capacity boost", () => {
    const plain = runTroopCalculator(stateWithPromotion("max", false));
    const boosted = runTroopCalculator(stateWithPromotion("max", true));

    expect(boosted.capacity).toBe(plain.capacity * 3);
    expect(boosted.tiers[9].infantry).toBe(
      promotionCapacity(boosted.capacity, "infantry", 9, 10),
    );
  });

  it("cuts a count above the promotion capacity", () => {
    const result = runTroopCalculator(stateWithPromotion(99_999_999));

    expect(result.tiers[9].infantry).toBe(
      promotionCapacity(result.capacity, "infantry", 9, 10),
    );
  });
});
