import type { Playthrough } from "@/types/app";
import { allBuildings } from "@/data/game/buildings";
import {
  charmLevels,
  chiefGearSlotList,
  gearLevels,
} from "@/data/game/chiefGear";
import { petRefiningPower } from "@/data/game/pets";
import { allResearch, researchTabs } from "@/data/game/research";
import { highestUnlockedLabel } from "./buildings";
import { CHARMS_PER_PIECE } from "./chiefGear";
import { buildExpertViews, expertPowerOf } from "./experts";
import {
  buildHeroViews,
  defaultMaxOutOptions,
  summarizeHeroes,
  withMaxedHeroes,
} from "./heroes";
import { buildPetViews } from "./pets";
import { tabLockOf } from "./research";
import { isCharmLevelUnlocked, isGearTierUnlocked } from "./unlocks";

const PET_REFINE_STATS = 6;

/** Buildings at the highest level the server age unlocks. A level with no power value adds 0. */
export const buildingsPossiblePower = (chief: Playthrough) =>
  allBuildings.reduce((sum, building) => {
    const label = highestUnlockedLabel(building, chief);
    return (
      sum + (building.levels.find((level) => level.label === label)?.power ?? 0)
    );
  }, 0);

/** Every research node at its top level, in the tabs the server age has opened. */
export const researchPossiblePower = (chief: Playthrough) => {
  const openCategories = new Set(
    researchTabs
      .filter((tab) => tabLockOf(tab, chief) === null)
      .flatMap((tab) => tab.categories),
  );
  return allResearch
    .filter((node) => openCategories.has(node.category))
    .reduce(
      (sum, node) =>
        sum + node.levels.reduce((total, level) => total + level.power, 0),
      0,
    );
};

/** Every hero of the unlocked generations with all tracks at the top. */
export const heroesPossiblePower = (chief: Playthrough) => {
  const maxed = withMaxedHeroes(chief, {
    ...defaultMaxOutOptions(),
    scope: "unlocked",
  });
  return summarizeHeroes(buildHeroViews(maxed), maxed).power;
};

/** Every expert the server age unlocks at the top of affinity and skills. */
export const expertsPossiblePower = (chief: Playthrough) =>
  buildExpertViews(chief)
    .filter((view) => !view.locked)
    .reduce((sum, view) => sum + expertPowerOf(view).max, 0);

/** Every pet the server age unlocks at its top level, advanced, with the best refinement. */
export const petsPossiblePower = (chief: Playthrough) =>
  buildPetViews(chief)
    .filter((view) => !view.locked)
    .reduce((sum, view) => {
      const top = view.pet.levels[view.pet.maxLevel - 1].troopsPower;
      const levelPower = top.refinedValue ?? top.value;
      const refining = Math.round(
        petRefiningPower(
          Array(PET_REFINE_STATS).fill(view.pet.maxRefinementPercent),
        ),
      );
      return sum + levelPower + refining;
    }, 0);

/** Six pieces at the highest Chief Gear level whose tier the server age unlocks. */
export const chiefGearPossiblePower = (chief: Playthrough) => {
  const top = gearLevels.findLast((level) =>
    isGearTierUnlocked(chief, level.tier),
  );
  return (top?.powerTotal ?? 0) * chiefGearSlotList.length;
};

/** Three charms on each gear piece at the highest Chief Charm level the server age unlocks. */
export const chiefCharmsPossiblePower = (chief: Playthrough) => {
  const top = charmLevels.findLast((level) =>
    isCharmLevelUnlocked(chief, level.level),
  );
  return (top?.powerTotal ?? 0) * chiefGearSlotList.length * CHARMS_PER_PIECE;
};
