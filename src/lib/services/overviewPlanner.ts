import type { UpgradeMaterial } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { findItem } from "@/data/game/items";
import { findResearch, isPlaceholder } from "@/data/game/research";
import { researchSpeedBonusPercent } from "./bonuses";
import { initialPlanRows, runPlan } from "./buildingPlan";
import {
  charmItems,
  gearItems,
  initialGoalMap,
  runItemPlan,
} from "./chiefGear";
import type { LadderItem } from "./chiefGear";
import { initialHeroGoals, runHeroPlan } from "./heroes";
import { ownedCount } from "./inventory";
import { initialPetGoals, runPetPlan } from "./pets";
import {
  defaultResearchControls,
  initialResearchRows,
  runResearchPlan,
} from "./researchPlan";
import { draftOfSavedPlan, runTroopsPlan } from "./troopsPlan";

export const PLANNER_ITEM_IDS = [
  "meat",
  "wood",
  "coal",
  "iron",
  "steel",
  "fire-crystal",
  "fire-crystal-shard",
  "refined-fire-crystal",
];

export type PlanPageId =
  | "buildings"
  | "research"
  | "heroes"
  | "troops"
  | "pets"
  | "chiefGear"
  | "chiefCharms";

export interface PlanCost {
  page: PlanPageId;
  materials: UpgradeMaterial[];
  incomplete: boolean;
}

const ladderCost = (
  page: "chiefGear" | "chiefCharms",
  items: LadderItem[],
): PlanCost | null => {
  if (items.every((item) => item.goal === null)) return null;
  return {
    page,
    materials: runItemPlan(items, initialGoalMap(items)).total.materials,
    incomplete: false,
  };
};

const buildingsCost = (chief: Playthrough): PlanCost | null => {
  const rows = initialPlanRows(chief);
  if (rows.length === 0) return null;
  const calculation = runPlan(rows, chief, 0);
  return {
    page: "buildings",
    materials: calculation.resources,
    incomplete: calculation.steps.some((step) => step.cost.length === 0),
  };
};

const researchCost = (chief: Playthrough): PlanCost | null => {
  const rows = initialResearchRows(chief);
  if (rows.length === 0) return null;
  const calculation = runResearchPlan(
    rows,
    chief,
    defaultResearchControls(chief),
    researchSpeedBonusPercent(chief),
  );
  return {
    page: "research",
    materials: calculation.resources,
    incomplete: rows.some((row) => {
      const node = findResearch(row.id);
      return node !== undefined && isPlaceholder(node);
    }),
  };
};

const heroesCost = (chief: Playthrough): PlanCost | null => {
  const goals = initialHeroGoals(chief);
  if (Object.keys(goals).length === 0) return null;
  const plan = runHeroPlan(chief, goals);
  return {
    page: "heroes",
    materials: [...plan.resources].map(([itemId, amount]) => ({
      itemId,
      amount,
    })),
    incomplete: false,
  };
};

const troopsCost = (chief: Playthrough): PlanCost | null => {
  const draft = draftOfSavedPlan(chief);
  if (draft.runs.length === 0) return null;
  return {
    page: "troops",
    materials: runTroopsPlan(chief, draft).calculation.resources,
    incomplete: false,
  };
};

const petsCost = (chief: Playthrough): PlanCost | null => {
  const goals = initialPetGoals(chief);
  if (Object.keys(goals).length === 0) return null;
  return {
    page: "pets",
    materials: runPetPlan(chief, goals).total.resources,
    incomplete: false,
  };
};

const planCostsOf = (chief: Playthrough): PlanCost[] =>
  [
    buildingsCost,
    researchCost,
    heroesCost,
    troopsCost,
    petsCost,
    (current: Playthrough) => ladderCost("chiefGear", gearItems(current)),
    (current: Playthrough) => ladderCost("chiefCharms", charmItems(current)),
  ].flatMap((cost) => {
    try {
      const result = cost(chief);
      return result ? [result] : [];
    } catch {
      // A goal that the calculator rejects adds nothing to the summary.
      return [];
    }
  });

export interface ShortageRow {
  itemId: string;
  name: string;
  img: string | undefined;
  need: number;
  have: number;
  short: number;
}

export interface PlannerSummary {
  pages: PlanPageId[];
  rows: ShortageRow[];
  shortCount: number;
  incomplete: boolean;
}

const byShortThenNeed = (a: ShortageRow, b: ShortageRow) =>
  b.short - a.short || b.need - a.need;

export const plannerSummaryOf = (chief: Playthrough): PlannerSummary => {
  const costs = planCostsOf(chief);
  const rows = PLANNER_ITEM_IDS.map((itemId): ShortageRow => {
    const need = costs
      .flatMap((cost) => cost.materials)
      .filter((material) => material.itemId === itemId)
      .reduce((sum, material) => sum + material.amount, 0);
    const have = ownedCount(chief, itemId);
    return {
      itemId,
      name: findItem(itemId)?.name ?? itemId,
      img: findItem(itemId)?.img,
      need,
      have,
      short: Math.max(0, need - have),
    };
  }).sort(byShortThenNeed);

  return {
    pages: costs.map((cost) => cost.page),
    rows,
    shortCount: rows.filter((row) => row.short > 0).length,
    incomplete: costs.some((cost) => cost.incomplete),
  };
};
