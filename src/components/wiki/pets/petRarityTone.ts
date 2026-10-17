import type { PetRarity } from "whiteout-survival-data";

export const petRarityTone = {
  Common: "kept",
  Uncommon: "fixed",
  Rare: "added",
  Epic: "changed",
  Legendary: "changed",
} as const satisfies Record<PetRarity, string>;
