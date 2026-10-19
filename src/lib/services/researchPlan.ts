import { calculateResearch, RESEARCH_CALCULATOR } from "whiteout-survival-data";
import type { ResearchCalculation } from "whiteout-survival-data";
import type { Appointment, Playthrough } from "@/types/app";
import { allResearch, maxLevelOf } from "@/data/game/research";
import { goalOfNode, levelOfNode } from "./research";

export const STATE_BUFF_PERCENT = RESEARCH_CALCULATOR.stateBuffSpeedPercent;

export const VICE_PRESIDENT_PERCENT: Record<Appointment, number> = {
  none: 0,
  regular: RESEARCH_CALCULATOR.vicePresidentSpeedPercent.regular,
  supreme: RESEARCH_CALCULATOR.vicePresidentSpeedPercent.supreme,
};

export interface ResearchPlanRow {
  id: string;
  current: number;
  goal: number;
}

export interface ResearchPlanControls {
  stateBuff: boolean;
  vicePresident: Appointment;
}

export const offResearchControls: ResearchPlanControls = {
  stateBuff: false,
  vicePresident: "none",
};

export const defaultResearchControls = (
  chief: Playthrough,
): ResearchPlanControls => ({
  stateBuff: chief.researchPlan?.stateBuff ?? false,
  vicePresident: chief.researchPlan?.vicePresident ?? "none",
});

/**
 * One row for each node whose goal is above its level.
 */
export const initialResearchRows = (chief: Playthrough): ResearchPlanRow[] =>
  allResearch.flatMap((node) => {
    const current = levelOfNode(chief, node);
    const goal = goalOfNode(chief, node);
    return goal > current ? [{ id: node.id, current, goal }] : [];
  });

export const rowForNode = (
  chief: Playthrough,
  nodeId: string,
): ResearchPlanRow | undefined => {
  const node = allResearch.find((item) => item.id === nodeId);
  if (!node) return undefined;
  const current = levelOfNode(chief, node);
  return { id: nodeId, current, goal: Math.min(current + 1, maxLevelOf(node)) };
};

export const researchSpeedPercent = (
  controls: ResearchPlanControls,
  bonusesPercent: number,
) =>
  bonusesPercent +
  (controls.stateBuff ? STATE_BUFF_PERCENT : 0) +
  VICE_PRESIDENT_PERCENT[controls.vicePresident];

/**
 * The calculator only checks prerequisites against the goals it is given. The nodes the chief
 * already has go in with the current level as the goal, so they do not show as unmet.
 */
export const runResearchPlan = (
  rows: ResearchPlanRow[],
  chief: Playthrough,
  controls: ResearchPlanControls,
  bonusesPercent: number,
): ResearchCalculation => {
  const planned = new Set(rows.map((row) => row.id));
  const owned = allResearch.flatMap((node) => {
    const level = levelOfNode(chief, node);
    return level > 0 && !planned.has(node.id)
      ? [{ id: node.id, current: level, goal: level }]
      : [];
  });

  return calculateResearch([...rows, ...owned], {
    researchSpeedPercent: bonusesPercent,
    stateBuff: controls.stateBuff,
    ...(controls.vicePresident === "none"
      ? {}
      : { vicePresident: controls.vicePresident }),
  });
};

export const withSavedResearchPlan = (
  chief: Playthrough,
  rows: ResearchPlanRow[],
  controls: ResearchPlanControls,
  savedAt: string,
): Playthrough => ({
  ...chief,
  researchPlan: {
    goals: Object.fromEntries(rows.map((row) => [row.id, row.goal])),
    ...controls,
    savedAt,
  },
});
