import {
  HERO_GEAR_EMPOWERMENT_REQUIREMENT,
  HERO_GEAR_MAX_EMPOWERMENT_LEVEL,
  HERO_GEAR_MAX_ENHANCEMENT_LEVEL,
  heroGearMasteryForging,
  heroGearSlots,
  heroGearStats,
} from "whiteout-survival-data";
import type { HeroGearQuality, HeroGearSlot, TroopType } from "@/types/app";

export const MAX_ENHANCEMENT = HERO_GEAR_MAX_ENHANCEMENT_LEVEL;
export const MAX_EMPOWERMENT = HERO_GEAR_MAX_EMPOWERMENT_LEVEL;
export const EMPOWERMENT_FORGING_ROW_ID =
  HERO_GEAR_EMPOWERMENT_REQUIREMENT.masteryForgingRowId;

export const gearSlots = heroGearSlots().get();
export const forgingRows = heroGearMasteryForging().get();

export const troopTypes = ["infantry", "lancer", "marksman"] as const;

export const findForgingRow = (id: string | null) =>
  forgingRows.find((row) => row.id === id);

export const forgingIndex = (id: string | null) =>
  id === null ? -1 : forgingRows.findIndex((row) => row.id === id);

export const EMPOWERMENT_FORGING_INDEX = forgingIndex(
  EMPOWERMENT_FORGING_ROW_ID,
);

export const statEntry = (slot: HeroGearSlot, troopType: TroopType) =>
  heroGearStats().bySlot(slot).byTroopType(troopType).first();

export const gearQualities: { id: HeroGearQuality; label: string }[] = [
  { id: "mythic", label: "Mythic" },
  { id: "epic", label: "Epic" },
  { id: "rare", label: "Rare" },
  { id: "uncommon", label: "Uncommon" },
  { id: "common", label: "Common" },
];

export const DEFAULT_QUALITY: HeroGearQuality = "mythic";
