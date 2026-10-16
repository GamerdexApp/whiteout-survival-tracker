import {
  calculateTroops,
  campFireCrystalLevel,
  TROOP_CALCULATOR,
  troopPower,
  troops,
} from "whiteout-survival-data";
import type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopData,
  TroopRun,
  TroopTier,
} from "whiteout-survival-data";

export type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopData,
  TroopRun,
  TroopTier,
};

export { calculateTroops, campFireCrystalLevel, TROOP_CALCULATOR, troopPower };

export const allTroops: TroopData[] = troops().get();

export const findTroop = (id: string) => troops().find(id);

export const MIN_TIER = TROOP_CALCULATOR.minTier;
export const MAX_TIER = TROOP_CALCULATOR.maxTier;

export const campBuildingId = (troopId: string) => `${troopId}-camp`;

export const WAR_ACADEMY_ID = "war-academy";
