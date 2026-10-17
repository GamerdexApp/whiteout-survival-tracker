import {
  buildings,
  calculateTroops,
  events,
  TROOP_CALCULATOR,
} from "whiteout-survival-data";
import type {
  Building,
  GameEvent,
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopCampResult,
  TroopRun,
  TroopType,
} from "whiteout-survival-data";

export type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopCampResult,
  TroopRun,
  TroopType,
};

export { calculateTroops, TROOP_CALCULATOR };

export const TROOP_TYPES: readonly TroopType[] = TROOP_CALCULATOR.troopTypes;

export interface CampLevelOption {
  label: string;
  capacity: number;
}

const campBuildingOf = (type: TroopType) =>
  buildings().find(`${type}-camp`) as Building;

/** The camp levels in game order, with the training capacity of each. */
export const campLevelsOf = (type: TroopType): CampLevelOption[] =>
  campBuildingOf(type).levels.map((level) => ({
    label: level.label,
    capacity: level.trainingCapacity as number,
  }));

export type TroopEventKey = keyof TroopCalculation["eventPoints"];

export type SpeedupEventKey = keyof TroopCalculation["speedupPointsPerMinute"];

export const TROOP_EVENT_KEYS: TroopEventKey[] = [
  "svs",
  "allianceShowdown",
  "kingOfIcefield",
  "hallOfChief",
];

const GAME_EVENT_ID_OF: Record<TroopEventKey, string> = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
  hallOfChief: "hall-of-chief",
};

export const troopEventNameOf = (key: TroopEventKey) =>
  (events().find(GAME_EVENT_ID_OF[key]) as GameEvent).name;
