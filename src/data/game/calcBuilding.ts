import { calculateBuildings, events } from "whiteout-survival-data";
import type {
  Building,
  BuildingCalculation,
  BuildingGoal,
  BuildingHallOfChiefPoints,
  BuildingStep,
  GameEvent,
  UpgradeMaterial,
} from "whiteout-survival-data";
import { levelledBuildings } from "./buildings";

export type {
  Building,
  BuildingCalculation,
  BuildingGoal,
  BuildingHallOfChiefPoints,
  BuildingStep,
  UpgradeMaterial,
};
export { calculateBuildings };
export { findBuildingById } from "./buildings";

/** The Entertainment buildings cost Blueprints, which the package cannot calculate. */
export const calculatorBuildings: Building[] = levelledBuildings;

/** The order of the resources in the results, as the game lists them. */
export const BUILDING_RESOURCE_ORDER = [
  "wood",
  "coal",
  "iron",
  "meat",
  "fire-crystal",
  "refined-fire-crystal",
];

export type BuildingScoreEventKey =
  keyof BuildingCalculation["speedupPointsPerMinute"];

export const BUILDING_SCORE_EVENT_KEYS: BuildingScoreEventKey[] = [
  "svs",
  "kingOfIcefield",
];

const GAME_EVENT_ID_OF: Record<BuildingScoreEventKey | "hallOfChief", string> =
  {
    svs: "svs-state-of-power",
    kingOfIcefield: "king-of-icefield",
    hallOfChief: "hall-of-chief",
  };

export const buildingEventNameOf = (
  key: BuildingScoreEventKey | "hallOfChief",
) => (events().find(GAME_EVENT_ID_OF[key]) as GameEvent).name;
