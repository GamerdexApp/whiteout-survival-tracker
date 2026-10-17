import {
  heroGearEmpowerment,
  heroGearEnhancement,
  heroGearStats,
} from "whiteout-survival-data";

export const enhancementRows = heroGearEnhancement().get();
export const empowermentRows = heroGearEmpowerment().get();
export const statEntries = heroGearStats().get();

export const STATS_EMPOWERMENT_OFFSET = 100;
