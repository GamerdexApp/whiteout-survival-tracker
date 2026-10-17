import type { Building, BuildingLevel } from "@/data/game/wikiBuildings";

export const LEVEL_RANGE_IDS = [
  "all",
  "standard",
  "fc3",
  "fc5",
  "fc8",
  "fc10",
] as const;
export type LevelRangeId = (typeof LEVEL_RANGE_IDS)[number];

type FireCrystalRangeId = Exclude<LevelRangeId, "all" | "standard">;

/** Each range ends on a base level (FC 3) and the next one starts at its first step (FC 3-1). */
const FIRE_CRYSTAL_BASE_LEVELS: Record<
  FireCrystalRangeId,
  { first: number; last: number }
> = {
  fc3: { first: 0, last: 3 },
  fc5: { first: 3, last: 5 },
  fc8: { first: 5, last: 8 },
  fc10: { first: 8, last: 10 },
};

const STEPS_PER_FIRE_CRYSTAL_LEVEL = 10;

/** Orders a label like 30-2, FC 3 or FC 3-1 by position: base 3 is 30 and FC 3-1 is 31. */
const fireCrystalPosition = (label: string): number | null => {
  const standardStep = /^30-(\d+)$/.exec(label);
  if (standardStep) return Number(standardStep[1]);
  const fireCrystal = /^FC (\d+)(?:-(\d+))?$/.exec(label);
  if (!fireCrystal) return null;
  return (
    Number(fireCrystal[1]) * STEPS_PER_FIRE_CRYSTAL_LEVEL +
    Number(fireCrystal[2] ?? 0)
  );
};

export const isLevelInRange = (level: BuildingLevel, range: LevelRangeId) => {
  if (range === "all") return true;
  if (range === "standard") return level.tier === "standard";
  if (level.tier !== "fireCrystal") return false;
  const position = fireCrystalPosition(level.label);
  if (position === null) return false;
  const { first, last } = FIRE_CRYSTAL_BASE_LEVELS[range];
  const lowest = first === 0 ? 0 : first * STEPS_PER_FIRE_CRYSTAL_LEVEL + 1;
  return position >= lowest && position <= last * STEPS_PER_FIRE_CRYSTAL_LEVEL;
};

export const levelsInRange = (building: Building, range: LevelRangeId) =>
  building.levels.filter((level) => isLevelInRange(level, range));

export const STAT_IDS = [
  "rallyCapacity",
  "marchCapacity",
  "trainingCapacity",
  "trainingSpeedBonusPercent",
  "researchSpeedBonusPercent",
  "infirmaryCapacity",
  "allyAssists",
  "allyHelpTimeSeconds",
  "reinforceCapacity",
  "storehouseCapacity",
  "barricadeDurability",
  "troopDeploymentCapacity",
] as const;
export type StatId = (typeof STAT_IDS)[number];

export const statIdsOf = (building: Building): StatId[] =>
  STAT_IDS.filter((id) =>
    building.levels.some((level) => level[id] !== undefined),
  );

export const matchesBuildingSearch = (name: string, search: string) =>
  name.toLowerCase().includes(search.trim().toLowerCase());

export interface ResourceTotal {
  itemId?: string;
  name?: string;
  amount: number;
}

/** The sum of every cost row of the levels, one entry for each resource in order of first use. */
export const totalCostOf = (levels: BuildingLevel[]): ResourceTotal[] => {
  const totals = new Map<string, ResourceTotal>();
  for (const level of levels) {
    for (const cost of level.cost) {
      const key = cost.itemId ?? cost.name ?? "";
      const known = totals.get(key);
      if (known) known.amount += cost.count;
      else
        totals.set(key, {
          itemId: cost.itemId,
          name: cost.name,
          amount: cost.count,
        });
    }
  }
  return [...totals.values()];
};

export const totalBuildSecondsOf = (levels: BuildingLevel[]) =>
  levels.reduce((sum, level) => sum + level.buildTimeSeconds, 0);
