import { calculateBuildings } from "whiteout-survival-data";
import type { BuildingCalculation, BuildingStep } from "whiteout-survival-data";
import type { Appointment, Playthrough } from "@/types/app";
import { findBuildingById, levelledBuildings } from "@/data/game/buildings";
import { buildView, knownLabel, levelledBuildingLevels } from "./buildings";

export const APPOINTMENT_PERCENT: Record<Appointment, number> = {
  none: 0,
  regular: 10,
  supreme: 15,
};

export const DOUBLE_TIME_PERCENT = 20;

export interface PlanRow {
  id: string;
  current: string | null;
  goal: string;
}

export interface PlanControls {
  vicePresident: Appointment;
  petSkill: boolean;
  chiefOrder: boolean;
}

export const defaultPlanControls = (chief: Playthrough): PlanControls => ({
  vicePresident: chief.buildingPlan?.vicePresident ?? "none",
  petSkill: chief.buildingPlan?.petSkill ?? false,
  chiefOrder: chief.buildingPlan?.chiefOrder ?? false,
});

/**
 * One row for each building whose goal is above its current level.
 */
export const initialPlanRows = (chief: Playthrough): PlanRow[] =>
  levelledBuildings.flatMap((building) => {
    const view = buildView(building, chief);
    return view.hasGoal && view.goal
      ? [{ id: building.id, current: view.level, goal: view.goal }]
      : [];
  });

export const constructionSpeedPercent = (
  controls: PlanControls,
  petSkillPercent: number,
  bonusesPercent: number,
) =>
  bonusesPercent +
  APPOINTMENT_PERCENT[controls.vicePresident] +
  (controls.petSkill ? petSkillPercent : 0) +
  (controls.chiefOrder ? DOUBLE_TIME_PERCENT : 0);

export const runPlan = (
  rows: PlanRow[],
  chief: Playthrough,
  speedPercent: number,
): BuildingCalculation =>
  calculateBuildings(
    rows.map((row) => ({ id: row.id, current: row.current, goal: row.goal })),
    {
      buildingLevels: levelledBuildingLevels(chief),
      constructionSpeedPercent: speedPercent,
    },
  );

export interface StepGroup {
  buildingId: string;
  name: string;
  fromLevel: string;
  toLevel: string;
  steps: number;
  prerequisite: boolean;
}

/**
 * Joins the steps of one building that follow each other. A prerequisite run stays apart from the
 * run the player asked for.
 */
export const groupSteps = (steps: BuildingStep[]): StepGroup[] =>
  steps.reduce<StepGroup[]>((groups, step) => {
    const last = groups[groups.length - 1];
    if (
      last &&
      last.buildingId === step.buildingId &&
      last.prerequisite === step.prerequisite
    ) {
      last.toLevel = step.level;
      last.steps += 1;
      return groups;
    }
    return [
      ...groups,
      {
        buildingId: step.buildingId,
        name: step.name,
        fromLevel: step.level,
        toLevel: step.level,
        steps: 1,
        prerequisite: step.prerequisite,
      },
    ];
  }, []);

export const rowFor = (
  chief: Playthrough,
  buildingId: string,
): PlanRow | undefined => {
  const building = findBuildingById(buildingId);
  if (!building) return undefined;
  const view = buildView(building, chief);
  const goal = view.next?.label ?? view.level;
  return goal ? { id: buildingId, current: view.level, goal } : undefined;
};

/**
 * Writes the plan goals to the buildings and keeps the plan itself. A building that is not in the
 * plan loses its goal.
 */
export const withSavedPlan = (
  chief: Playthrough,
  rows: PlanRow[],
  controls: PlanControls,
  savedAt: string,
): Playthrough => {
  const goalById = new Map(rows.map((row) => [row.id, row.goal]));
  const buildings = { ...chief.buildings };

  levelledBuildings.forEach((building) => {
    const goal = knownLabel(building, goalById.get(building.id));
    const existing = buildings[building.id];
    if (goal) {
      buildings[building.id] = { ...existing, goal };
    } else if (existing?.goal) {
      buildings[building.id] = { ...existing, goal: null };
    }
  });

  return {
    ...chief,
    buildings,
    buildingPlan: {
      goals: Object.fromEntries(
        rows.map((row) => [row.id, { current: row.current, goal: row.goal }]),
      ),
      ...controls,
      savedAt,
    },
  };
};
