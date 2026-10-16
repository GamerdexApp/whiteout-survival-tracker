import {
  allianceBanner,
  allianceFacility,
  allianceFortress,
  allianceTech,
} from "whiteout-survival-data";
import type {
  AllianceBannerLevel,
  AllianceFacility,
  AllianceFortress,
  AllianceFortressKind,
  AllianceTechCategory,
  AllianceTechNode,
} from "whiteout-survival-data";

export const bannerRanges: AllianceBannerLevel[] = allianceBanner().get();

export const MAX_BANNER_LEVEL = bannerRanges[bannerRanges.length - 1].maxLevel;

export const bannerRangeAt = (level: number) =>
  allianceBanner().atLevel(level).first();

export const BANNER_RESOURCE_IDS = ["meat", "wood", "coal", "iron"];

export const techNodes: AllianceTechNode[] = allianceTech().get();

export const findTechNode = (id: string) => allianceTech().find(id);

export const techCategories: AllianceTechCategory[] = [
  "Growth",
  "Territory",
  "Battle",
];

export const TECH_TIERS = [1, 2, 3];

export const facilities: AllianceFacility[] = allianceFacility().get();

export const fortresses: AllianceFortress[] = allianceFortress().get();

export const fortressKinds: AllianceFortressKind[] = [
  "castle",
  "stronghold",
  "fortress",
];

/** The map is a square grid of this many units on each side. */
export const MAP_SIZE = 1200;
export const MAP_GRID_STEP = 200;
