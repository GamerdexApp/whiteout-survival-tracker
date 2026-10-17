import {
  fireCrystalShardTable,
  fireCrystalTable,
} from "whiteout-survival-data";
import type {
  FireCrystalLevelRange,
  FireCrystalShardTier,
} from "whiteout-survival-data";

export type {
  FireCrystalShardTable,
  FireCrystalTable,
} from "whiteout-survival-data";

const FIRE_CRYSTAL_RANGES = {
  all: undefined,
  early: { from: 1, to: 5 },
  late: { from: 6, to: 10 },
} satisfies Record<string, FireCrystalLevelRange | undefined>;

export type FireCrystalRangeId = keyof typeof FIRE_CRYSTAL_RANGES;

export const FIRE_CRYSTAL_RANGE_IDS = Object.keys(
  FIRE_CRYSTAL_RANGES,
) as FireCrystalRangeId[];

export const buildFireCrystalTable = (range: FireCrystalRangeId) =>
  fireCrystalTable(undefined, FIRE_CRYSTAL_RANGES[range]);

export type ShardTierId = "all" | FireCrystalShardTier;

export const SHARD_TIER_IDS: ShardTierId[] = ["all", "T11", "T12"];

export const buildShardTable = (tier: ShardTierId) =>
  fireCrystalShardTable(undefined, tier === "all" ? undefined : [tier]);
