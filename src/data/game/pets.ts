import {
  PET_ADVANCEMENT_INTERVAL,
  PET_REFINEMENT_STATS,
  PET_REFINING_POWER_PER_PERCENT,
  petRefiningPower,
  pets,
} from "whiteout-survival-data";
import type { Pet, PetRarity } from "whiteout-survival-data";

export const allPets: Pet[] = pets().get();

export const findPet = (id: string) => pets().find(id);

export {
  PET_ADVANCEMENT_INTERVAL,
  PET_REFINEMENT_STATS,
  PET_REFINING_POWER_PER_PERCENT,
  petRefiningPower,
};

export const petRarities: PetRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
];

export const petsOfRarity = (rarity: PetRarity) =>
  pets().byRarity(rarity).get();

export const PET_FOOD_ID = "pet-food";
export const TAMING_MANUAL_ID = "taming-manual";
export const ENERGIZING_POTION_ID = "energizing-potion";
export const PLAN_ITEM_IDS = [
  PET_FOOD_ID,
  TAMING_MANUAL_ID,
  ENERGIZING_POTION_ID,
];

/**
 * The only pet whose skill changes a city build time. Its skill value at the pet tier is the
 * Construction Speed percent.
 */
export const CONSTRUCTION_PET_ID = "cave-hyena";
