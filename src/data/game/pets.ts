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
export const STRENGTHENING_SERUM_ID = "strengthening-serum";
export const ADVANCEMENT_CHEST_ID = "pet-advancement-materials-custom-chest";
/**
 * What one Pet Advancement Materials Custom Chest gives for the pick of each plan item, from the
 * item description in the package.
 */
export const CHEST_TAMING_MANUALS = 7;
export const CHEST_ENERGIZING_POTIONS = 2;
export const CHEST_STRENGTHENING_SERUMS = 1;
export const PLAN_ITEM_IDS = [
  PET_FOOD_ID,
  TAMING_MANUAL_ID,
  ENERGIZING_POTION_ID,
  STRENGTHENING_SERUM_ID,
];

/**
 * The items a chest can give, in the order the held chests go to a shortage. The Strengthening
 * Serum is the scarcest, then the Energizing Potion, then the Taming Manual.
 */
export const CHEST_PICKS = [
  { itemId: STRENGTHENING_SERUM_ID, perChest: CHEST_STRENGTHENING_SERUMS },
  { itemId: ENERGIZING_POTION_ID, perChest: CHEST_ENERGIZING_POTIONS },
  { itemId: TAMING_MANUAL_ID, perChest: CHEST_TAMING_MANUALS },
] as const;

/**
 * The only pet whose skill changes a city build time. Its skill value at the pet tier is the
 * Construction Speed percent.
 */
export const CONSTRUCTION_PET_ID = "cave-hyena";
