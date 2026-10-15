import type { BuildingCalculation } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { findItem, RESOURCE_ITEM_IDS } from "@/data/game/items";
import { initialPlanRows, runPlan } from "./buildingPlan";
import { constructionSpeedupMinutes, ownedCount } from "./inventory";

export interface StockCheck {
  id: string;
  name: string;
  available: number;
  needed: number;
  unit?: string;
}

export const stockShortBy = (check: StockCheck) =>
  Math.max(0, check.needed - check.available);

/**
 * What a plan takes, set against what the chief holds. The time row compares the speedup minutes
 * the plan needs with the construction and general speedups on hand.
 */
export const resourceChecks = (
  calculation: BuildingCalculation,
  chief: Playthrough,
): StockCheck[] => [
  ...RESOURCE_ITEM_IDS.map((id) => ({
    id,
    name: findItem(id)?.name ?? id,
    available: ownedCount(chief, id),
    needed:
      calculation.resources.find((resource) => resource.itemId === id)
        ?.amount ?? 0,
  })),
  {
    id: "construction-time",
    name: "Construction time, as speedups",
    available: constructionSpeedupMinutes(chief),
    needed: calculation.speedupMinutesNeeded,
    unit: "min",
  },
];

/**
 * The resources that the building goals on the Buildings page need more of than the chief holds.
 * It is a note for the Resources page, not a calculator.
 */
export const plannerShortages = (chief: Playthrough): string[] => {
  const rows = initialPlanRows(chief);
  if (rows.length === 0) return [];

  try {
    return resourceChecks(runPlan(rows, chief, 0), chief)
      .filter((check) => check.unit === undefined && stockShortBy(check) > 0)
      .map((check) => check.name);
  } catch {
    return [];
  }
};
