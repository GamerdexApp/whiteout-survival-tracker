import type { Pet } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { buildPetView } from "./pets";

const REFINEMENT_SLOTS = 6;

export interface PetMaxPower {
  /** Level Power plus Advancement Power at the max level, advanced. Null when the package has none. */
  levelPower: number | null;
  /** Refining Power with every refinement at the pet maximum percent. */
  refiningPower: number;
  total: number | null;
}

/** The pet at its max level, advanced and fully refined. It uses the same rule as the Pets page. */
export const maxPowerOf = (pet: Pet): PetMaxPower => {
  const chief: Playthrough = {
    id: "wiki",
    name: "",
    createdAt: "",
    lastModified: "",
    heroGenerationUnlocked: 1,
    pets: {
      [pet.id]: {
        unlocked: true,
        level: pet.maxLevel,
        advanced: true,
        refine: Array(REFINEMENT_SLOTS).fill(pet.maxRefinementPercent),
      },
    },
  };
  const view = buildPetView(chief, pet);
  return {
    levelPower: view.levelPower,
    refiningPower: view.refiningPower,
    total: view.power,
  };
};

export type SkillValueKind = "percent" | "duration" | "number";

/**
 * The package has no unit for the skill values, so the unit comes from the skill text. A skill
 * that lists percents in its description gives percents, and a skill whose values are its
 * cooldown tiers gives durations.
 */
export const skillValueKindOf = (pet: Pet): SkillValueKind => {
  const { description, values, cooldownSecondsByTier } = pet.skill;
  if (/\d\s*%\s*\//.test(description)) return "percent";
  const valuesAreCooldowns =
    cooldownSecondsByTier !== undefined &&
    values.length === cooldownSecondsByTier.length &&
    values.every((value, index) => value === cooldownSecondsByTier[index]);
  return valuesAreCooldowns ? "duration" : "number";
};
