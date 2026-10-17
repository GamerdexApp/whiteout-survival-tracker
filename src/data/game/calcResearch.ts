import { calculateResearch, RESEARCH_CALCULATOR } from "whiteout-survival-data";

export type {
  ResearchCalculation,
  ResearchItemResult,
  ResearchNode,
  UnmetResearchPrerequisite,
} from "whiteout-survival-data";
export { calculateResearch };
export { findBuildingById } from "./buildings";
export {
  allResearch,
  findResearch,
  gameOrder,
  isPlaceholder,
  maxLevelOf,
  nodesOfTab,
  researchTabs,
  troopLineOf,
} from "./research";
export type { ResearchTab, ResearchTabId } from "./research";

export const STATE_BUFF_PERCENT = RESEARCH_CALCULATOR.stateBuffSpeedPercent;

export const VICE_PRESIDENT_PERCENT = {
  none: 0,
  regular: RESEARCH_CALCULATOR.vicePresidentSpeedPercent.regular,
  supreme: RESEARCH_CALCULATOR.vicePresidentSpeedPercent.supreme,
} as const;

export type VicePresident = keyof typeof VICE_PRESIDENT_PERCENT;

export const SPEEDUP_EVENT_IDS = [
  "svs",
  "allianceShowdown",
  "kingOfIcefield",
] as const;
