import { calculatePets, events } from "whiteout-survival-data";
import type {
  GameEvent,
  PetCalculation,
  PetEventPoints,
  PetGoal,
  PetItemResult,
} from "whiteout-survival-data";

export type { Pet, PetRarity } from "whiteout-survival-data";
export type { PetCalculation, PetEventPoints, PetGoal, PetItemResult };
export { allPets, findPet, PET_ADVANCEMENT_INTERVAL } from "./pets";
export { calculatePets };

const PET_EVENT_IDS = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
} as const satisfies Record<keyof PetEventPoints, string>;

export type PetEventKey = keyof typeof PET_EVENT_IDS;

export const PET_EVENT_KEYS = Object.keys(PET_EVENT_IDS) as PetEventKey[];

export const petEventName = (key: PetEventKey) =>
  (events().find(PET_EVENT_IDS[key]) as GameEvent).name;

/** Hall of Chief has no pet advancement scoring row, so pets give it no points. */
export const hallOfChiefName = () =>
  (events().find("hall-of-chief") as GameEvent).name;
