import type { Playthrough } from "@/types/app";
import {
  BANNER_RESOURCE_IDS,
  bannerRangeAt,
  bannerRanges,
  MAX_BANNER_LEVEL,
} from "@/data/game/alliance";
import { ownedFacilityLevelCount } from "./allianceFacilities";
import { allTechCounts } from "./allianceTech";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const bannerLevelOf = (chief: Playthrough) =>
  clamp(Math.trunc(chief.alliance?.bannerLevel ?? 0), 0, MAX_BANNER_LEVEL);

export const withBannerLevel = (
  chief: Playthrough,
  level: number,
): Playthrough => ({
  ...chief,
  alliance: {
    ...chief.alliance,
    bannerLevel: clamp(Math.trunc(level), 0, MAX_BANNER_LEVEL),
  },
});

export type BannerRangeState = "built" | "current" | "notBuilt";

export interface BannerCostCell {
  itemId: string;
  /** Null when the range does not need the resource. */
  amount: number | null;
}

export interface BannerRow {
  id: string;
  name: string;
  state: BannerRangeState;
  /** True for a range with no cost at all (Level 0-10). */
  free: boolean;
  cells: BannerCostCell[];
}

const cellsOf = (
  cost: { itemId: string; amount: number }[],
): BannerCostCell[] =>
  BANNER_RESOURCE_IDS.map((itemId) => ({
    itemId,
    amount: cost.find((line) => line.itemId === itemId)?.amount ?? null,
  }));

const stateOf = (
  range: { minLevel: number; maxLevel: number },
  level: number,
): BannerRangeState =>
  range.maxLevel < level
    ? "built"
    : range.minLevel <= level
      ? "current"
      : "notBuilt";

export const bannerRows = (chief: Playthrough): BannerRow[] => {
  const level = bannerLevelOf(chief);
  return bannerRanges.map((range) => ({
    id: range.id,
    name: range.name,
    state: stateOf(range, level),
    free: range.cost.length === 0,
    cells: cellsOf(range.cost),
  }));
};

/** The range that holds the banner level of the chief. Every level 0 to 285 has one. */
export const currentBannerRow = (chief: Playthrough): BannerRow => {
  const level = bannerLevelOf(chief);
  const range = bannerRangeAt(level)!;
  return {
    id: range.id,
    name: range.name,
    state: "current",
    free: range.cost.length === 0,
    cells: cellsOf(range.cost),
  };
};

export interface StructuresOverview {
  techNodes: number;
  maxed: number;
  inProgress: number;
  locked: number;
  facilityLevelsOwned: number;
}

export const structuresOverview = (chief: Playthrough): StructuresOverview => {
  const counts = allTechCounts(chief);
  return {
    techNodes: counts.total,
    maxed: counts.maxed,
    inProgress: counts.inProgress,
    locked: counts.locked,
    facilityLevelsOwned: ownedFacilityLevelCount(chief),
  };
};
