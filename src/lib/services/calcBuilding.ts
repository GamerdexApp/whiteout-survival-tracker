import type { Appointment } from "@/types/app";
import {
  BUILDING_RESOURCE_ORDER,
  BUILDING_SCORE_EVENT_KEYS,
  buildingEventNameOf,
  calculateBuildings,
  calculatorBuildings,
} from "@/data/game/calcBuilding";
import type {
  Building,
  BuildingCalculation,
  BuildingGoal,
  BuildingScoreEventKey,
  BuildingStep,
  UpgradeMaterial,
} from "@/data/game/calcBuilding";
import { APPOINTMENT_PERCENT, DOUBLE_TIME_PERCENT } from "./buildingPlan";

export { APPOINTMENT_PERCENT, DOUBLE_TIME_PERCENT };

export const MAX_SPEED_PERCENT = 10_000;
export const MAX_SPEEDUP_MINUTES = 100_000_000;

/**
 * A level is its position in the level list of the building: 0 is not built, 1 is the first
 * level, and the length of the list is the last level.
 */
export interface BuildingLevels {
  current: number;
  goal: number;
}

export type LevelKey = keyof BuildingLevels;

export interface BuildingCalculatorInputs {
  /** Buildings left out are not built and have no goal. */
  levels: Record<string, BuildingLevels>;
  speedPercent: number;
  vicePresident: Appointment;
  doubleTime: boolean;
  speedupMinutes: number;
}

export const initialBuildingInputs: BuildingCalculatorInputs = {
  levels: {},
  speedPercent: 0,
  vicePresident: "none",
  doubleTime: false,
  speedupMinutes: 0,
};

const NOT_BUILT: BuildingLevels = { current: 0, goal: 0 };

export const levelsOf = (
  inputs: BuildingCalculatorInputs,
  buildingId: string,
): BuildingLevels => inputs.levels[buildingId] ?? NOT_BUILT;

const levelsWith = (
  levels: BuildingLevels,
  key: LevelKey,
  value: number,
): BuildingLevels =>
  key === "current"
    ? { current: value, goal: Math.max(levels.goal, value) }
    : { current: Math.min(levels.current, value), goal: value };

export const withLevel = (
  inputs: BuildingCalculatorInputs,
  buildingId: string,
  key: LevelKey,
  value: number,
): BuildingCalculatorInputs => ({
  ...inputs,
  levels: {
    ...inputs.levels,
    [buildingId]: levelsWith(levelsOf(inputs, buildingId), key, value),
  },
});

/** The positions from `from` to the last level of the building, as in `BuildingLevels`. */
export const levelPositions = (building: Building, from: number) =>
  Array.from(
    { length: building.levels.length - from + 1 },
    (_, index) => from + index,
  );

/** The package label of a level position. Position 0 has no label, because it is not built. */
export const labelAt = (building: Building, position: number) =>
  building.levels[position - 1].label;

const labelOrNull = (building: Building, position: number) =>
  position === 0 ? null : labelAt(building, position);

export const totalSpeedPercent = (inputs: BuildingCalculatorInputs) =>
  inputs.speedPercent +
  APPOINTMENT_PERCENT[inputs.vicePresident] +
  (inputs.doubleTime ? DOUBLE_TIME_PERCENT : 0);

/**
 * Every built building goes in as a level the player has, because the package adds the steps of a
 * prerequisite building from the level it is given.
 */
export const runBuildingCalculator = (
  inputs: BuildingCalculatorInputs,
): BuildingCalculation => {
  const buildingLevels: Record<string, string> = {};
  const goals: BuildingGoal[] = [];
  for (const building of calculatorBuildings) {
    const { current, goal } = levelsOf(inputs, building.id);
    if (current > 0) buildingLevels[building.id] = labelAt(building, current);
    if (goal > current) {
      goals.push({
        id: building.id,
        current: labelOrNull(building, current),
        goal: labelAt(building, goal),
      });
    }
  }
  return calculateBuildings(goals, {
    buildingLevels,
    constructionSpeedPercent: totalSpeedPercent(inputs),
  });
};

const resourceRank = (itemId: string) =>
  BUILDING_RESOURCE_ORDER.indexOf(itemId);

export const inResourceOrder = (resources: UpgradeMaterial[]) =>
  [...resources].sort(
    (a, b) => resourceRank(a.itemId) - resourceRank(b.itemId),
  );

const addedResources = (steps: BuildingStep[]) => {
  const totals = new Map<string, number>();
  for (const material of steps.flatMap((step) => step.cost)) {
    totals.set(
      material.itemId,
      (totals.get(material.itemId) ?? 0) + material.amount,
    );
  }
  return inResourceOrder(
    [...totals].map(([itemId, amount]) => ({ itemId, amount })),
  );
};

export interface BuildingBreakdownRow {
  buildingId: string;
  name: string;
  fromLevel: string;
  toLevel: string;
  steps: number;
  /** True when every step of the building is a prerequisite of another goal. */
  prerequisiteOnly: boolean;
  power: number;
  baseSeconds: number;
  resources: UpgradeMaterial[];
}

/** One row for each building with steps, in the order the package builds them first. */
export const breakdownRowsOf = (
  calculation: BuildingCalculation,
): BuildingBreakdownRow[] => {
  const stepsByBuilding = new Map<string, BuildingStep[]>();
  for (const step of calculation.steps) {
    stepsByBuilding.set(step.buildingId, [
      ...(stepsByBuilding.get(step.buildingId) ?? []),
      step,
    ]);
  }
  return [...stepsByBuilding].map(([buildingId, steps]) => ({
    buildingId,
    name: steps[0].name,
    fromLevel: steps[0].level,
    toLevel: steps[steps.length - 1].level,
    steps: steps.length,
    prerequisiteOnly: steps.every((step) => step.prerequisite),
    power: steps.reduce((sum, step) => sum + step.power, 0),
    baseSeconds: steps.reduce((sum, step) => sum + step.baseSeconds, 0),
    resources: addedResources(steps),
  }));
};

/** A building that is not in the data can be named on many steps, so each one is listed once. */
export const unmetPrerequisitesOf = (calculation: BuildingCalculation) => [
  ...new Map(
    calculation.unmetPrerequisites.map((item) => [
      `${item.building}|${item.level}`,
      item,
    ]),
  ).values(),
];

export const usedSpeedupMinutes = (
  inputs: BuildingCalculatorInputs,
  calculation: BuildingCalculation,
) => Math.min(inputs.speedupMinutes, calculation.speedupMinutesNeeded);

export interface ScoreEventRow {
  key: BuildingScoreEventKey;
  name: string;
  crystalPoints: number;
  speedupPoints: number;
  total: number;
}

/** Speedup minutes above the minutes the build time needs score nothing. */
export const scoreEventRowsOf = (
  inputs: BuildingCalculatorInputs,
  calculation: BuildingCalculation,
): ScoreEventRow[] =>
  BUILDING_SCORE_EVENT_KEYS.map((key) => {
    const crystalPoints = calculation.eventPoints[key];
    const speedupPoints =
      usedSpeedupMinutes(inputs, calculation) *
      calculation.speedupPointsPerMinute[key];
    return {
      key,
      name: buildingEventNameOf(key),
      crystalPoints,
      speedupPoints,
      total: crystalPoints + speedupPoints,
    };
  });
