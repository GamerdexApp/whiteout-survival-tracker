import type {
  BuildingCalculation,
  ResearchCalculation,
} from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { findItem, RESOURCE_ITEM_IDS } from "@/data/game/items";
import { researchSpeedBonusPercent } from "./bonuses";
import { initialPlanRows, runPlan } from "./buildingPlan";
import {
  constructionSpeedupMinutes,
  ownedCount,
  researchSpeedupMinutes,
} from "./inventory";
import {
  defaultResearchControls,
  initialResearchRows,
  runResearchPlan,
} from "./researchPlan";

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
 * The same check for a research plan. It lists the items the plan takes, in the order the
 * calculator gives them, and compares the research time with the research and general speedups.
 */
export const researchChecks = (
  calculation: ResearchCalculation,
  chief: Playthrough,
): StockCheck[] => [
  ...calculation.resources.map((resource) => ({
    id: resource.itemId,
    name: findItem(resource.itemId)?.name ?? resource.itemId,
    available: ownedCount(chief, resource.itemId),
    needed: resource.amount,
  })),
  {
    id: "research-time",
    name: "Research time, as speedups",
    available: researchSpeedupMinutes(chief),
    needed: calculation.speedupMinutesNeeded,
    unit: "min",
  },
];

const shortNamesOf = (checks: StockCheck[]) =>
  checks
    .filter((check) => check.unit === undefined && stockShortBy(check) > 0)
    .map((check) => check.name);

/**
 * The resources that the goals on the Buildings and Research pages need more of than the chief
 * holds. It is a note for the Resources page, not a calculator.
 */
export const plannerShortages = (chief: Playthrough): string[] => {
  const names = new Set<string>();

  const buildingRows = initialPlanRows(chief);
  if (buildingRows.length > 0) {
    try {
      shortNamesOf(
        resourceChecks(runPlan(buildingRows, chief, 0), chief),
      ).forEach((name) => names.add(name));
    } catch {
      // A goal the calculator rejects adds nothing to the note.
    }
  }

  const researchRows = initialResearchRows(chief);
  if (researchRows.length > 0) {
    try {
      const calculation = runResearchPlan(
        researchRows,
        chief,
        defaultResearchControls(chief),
        researchSpeedBonusPercent(chief),
      );
      shortNamesOf(researchChecks(calculation, chief)).forEach((name) =>
        names.add(name),
      );
    } catch {
      // A goal the calculator rejects adds nothing to the note.
    }
  }

  return [...names];
};
