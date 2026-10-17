import { calculateHeroGear } from "whiteout-survival-data";
import type {
  HeroGearCalculation,
  HeroGearEventPoints,
  HeroGearGoal,
  HeroGearPiece,
  HeroGearStatsResult,
} from "whiteout-survival-data";
import { gameEventById } from "./gameEvents";

export type {
  HeroGearCalculation,
  HeroGearEventPoints,
  HeroGearGoal,
  HeroGearQuality,
  HeroGearRequirement,
  HeroGearSlot,
  HeroGearStatsResult,
  HeroGearStatValues,
  TroopType,
} from "whiteout-survival-data";
export {
  DEFAULT_QUALITY,
  EMPOWERMENT_FORGING_INDEX,
  forgingIndex,
  forgingRows,
  gearQualityIds,
  gearSlots,
  MAX_EMPOWERMENT,
  MAX_ENHANCEMENT,
  troopTypes,
} from "./heroGear";

export type HeroGearPieceGoal = HeroGearGoal & { piece: HeroGearPiece };
export type HeroGearPieceCalculation = HeroGearCalculation & {
  stats: HeroGearStatsResult;
};

/** The package returns `stats` for every goal that names a piece. */
export const calculateHeroGearPiece = (goal: HeroGearPieceGoal) =>
  calculateHeroGear(goal) as HeroGearPieceCalculation;

const EVENT_IDS: Record<keyof HeroGearEventPoints, string> = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
};

export const heroGearEventKeys = Object.keys(
  EVENT_IDS,
) as (keyof HeroGearEventPoints)[];

export const heroGearEventName = (key: keyof HeroGearEventPoints) =>
  gameEventById(EVENT_IDS[key])!.name;
