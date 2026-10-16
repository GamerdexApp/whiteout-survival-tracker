import type { Building, ResearchRequirement } from "whiteout-survival-data";
import type { Playthrough, TroopId } from "@/types/app";
import { findBuildingById, furnace } from "@/data/game/buildings";
import { findResearch } from "@/data/game/research";
import {
  allTroops,
  campBuildingId,
  campFireCrystalLevel,
  findTroop,
  troopPower,
} from "@/data/game/troops";
import type { TroopData, TroopTier } from "@/data/game/troops";
import { knownLabel, levelOrder } from "./buildings";
import { levelOfNode } from "./research";

export const TROOP_IDS: TroopId[] = allTroops.map((troop) => troop.id);

export const MAX_TROOPS = 999_999_999;

const HIDE_LOW_TIERS_FURNACE_LEVEL = "30";
export const HIGHEST_HIDDEN_TIER = 9;

export const campOf = (troopId: TroopId) =>
  findBuildingById(campBuildingId(troopId)) as Building;

export const campLabelOf = (chief: Playthrough, troopId: TroopId) =>
  knownLabel(
    campOf(troopId),
    chief.buildings?.[campBuildingId(troopId)]?.level,
  );

const clampCount = (count: number) =>
  Math.min(
    MAX_TROOPS,
    Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)),
  );

export const countOf = (chief: Playthrough, troopId: TroopId, tier: number) =>
  clampCount(chief.troops?.[troopId]?.counts?.[tier] ?? 0);

export type TierRequirement =
  | { kind: "camp"; troopName: string; level: string }
  | { kind: "building"; name: string; level: string }
  | { kind: "research"; name: string; level: number };

const requirementOf = (
  troop: TroopData,
  tier: TroopTier,
): TierRequirement[] => {
  if (tier.unlockCampLevel !== undefined) {
    return [
      {
        kind: "camp",
        troopName: troop.name,
        level: String(tier.unlockCampLevel),
      },
    ];
  }
  return (tier.unlockRequirements ?? []).map((requirement) =>
    requirement.type === "building"
      ? {
          kind: "building",
          name: findBuildingById(requirement.id)?.name ?? requirement.id,
          level: String(requirement.level),
        }
      : {
          kind: "research",
          name: findResearch(requirement.id)?.name ?? requirement.id,
          level: Number(requirement.level),
        },
  );
};

const requirementMet = (
  chief: Playthrough,
  requirement: ResearchRequirement,
) => {
  if (requirement.type === "building") {
    const building = findBuildingById(requirement.id);
    if (!building) return false;
    const held = chief.buildings?.[requirement.id]?.level;
    return (
      levelOrder(building, held) >=
      levelOrder(building, String(requirement.level))
    );
  }
  const node = findResearch(requirement.id);
  return (
    node !== undefined && levelOfNode(chief, node) >= Number(requirement.level)
  );
};

const tierUnlocked = (
  chief: Playthrough,
  troop: TroopData,
  tier: TroopTier,
) => {
  if (tier.unlockCampLevel !== undefined) {
    const camp = campOf(troop.id);
    const held = campLabelOf(chief, troop.id);
    return (
      held !== null &&
      levelOrder(camp, held) >= levelOrder(camp, String(tier.unlockCampLevel))
    );
  }
  return (tier.unlockRequirements ?? []).every((requirement) =>
    requirementMet(chief, requirement),
  );
};

/**
 * The highest tier the camp level and, for tiers 11 and 12, the War Academy and research allow.
 * It is 0 while no tier is unlocked.
 */
export const highestTierOf = (chief: Playthrough, troopId: TroopId) => {
  const troop = findTroop(troopId) as TroopData;
  return troop.tiers.reduce(
    (highest, tier) => (tierUnlocked(chief, troop, tier) ? tier.tier : highest),
    0,
  );
};

export const hideLowTiersAvailable = (chief: Playthrough) =>
  levelOrder(furnace, chief.buildings?.furnace?.level) >=
  levelOrder(furnace, HIDE_LOW_TIERS_FURNACE_LEVEL);

export const hideLowTiersOn = (chief: Playthrough) =>
  hideLowTiersAvailable(chief) && chief.troops?.hideLowTiers !== false;

export interface TroopTierView {
  tier: number;
  count: number;
  locked: boolean;
  seconds: number;
  cost: { itemId: string; amount: number }[];
  unitPower: number;
  power: number;
  requirements: TierRequirement[];
}

export interface TroopTypeView {
  id: TroopId;
  name: string;
  campLabel: string | null;
  highestTier: number;
  total: number;
  power: number;
  tiers: TroopTierView[];
}

const buildTypeView = (chief: Playthrough, troop: TroopData): TroopTypeView => {
  const highestTier = highestTierOf(chief, troop.id);
  const campLabel = campLabelOf(chief, troop.id);
  const crystalLevel = campLabel ? campFireCrystalLevel(campLabel) : 0;
  const tiers = troop.tiers.map((tier) => {
    const count = countOf(chief, troop.id, tier.tier);
    const unitPower = troopPower(troop, tier.tier, crystalLevel) ?? 0;
    return {
      tier: tier.tier,
      count,
      locked: tier.tier > highestTier,
      seconds: tier.trainingTimeSeconds,
      cost: tier.cost,
      unitPower,
      power: unitPower * count,
      requirements: requirementOf(troop, tier),
    };
  });
  return {
    id: troop.id,
    name: troop.name,
    campLabel,
    highestTier,
    total: tiers.reduce((sum, tier) => sum + tier.count, 0),
    power: tiers.reduce((sum, tier) => sum + tier.power, 0),
    tiers,
  };
};

export const buildTroopViews = (chief: Playthrough) =>
  allTroops.map((troop) => buildTypeView(chief, troop));

export const visibleTiers = (view: TroopTypeView, hideLow: boolean) =>
  hideLow
    ? view.tiers.filter((tier) => tier.tier > HIGHEST_HIDDEN_TIER)
    : view.tiers;

export const withTroopCount = (
  chief: Playthrough,
  troopId: TroopId,
  tier: number,
  count: number,
): Playthrough => {
  const counts = { ...chief.troops?.[troopId]?.counts };
  const value = clampCount(count);
  if (value === 0) delete counts[tier];
  else counts[tier] = value;
  return {
    ...chief,
    troops: {
      ...chief.troops,
      [troopId]: { ...chief.troops?.[troopId], counts },
    },
  };
};

export const withHideLowTiers = (
  chief: Playthrough,
  hideLowTiers: boolean,
): Playthrough => ({ ...chief, troops: { ...chief.troops, hideLowTiers } });
