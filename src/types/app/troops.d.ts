export type TroopId = "infantry" | "lancer" | "marksman";

/**
 * The troop count of each tier, keyed by the tier number from 1 to 12. A missing tier counts 0.
 */
export type TroopCounts = Record<string, number>;

export interface TroopTypeState {
  counts?: TroopCounts;
}

export interface TroopsState {
  hideLowTiers?: boolean;
  /** The UTC day (YYYY-MM-DD) of the last Call of War claim. */
  callOfWarClaimedOn?: string;
  infantry?: TroopTypeState;
  lancer?: TroopTypeState;
  marksman?: TroopTypeState;
}

export type TroopRunMode = "training" | "promotion";

export interface TroopRunState {
  camp: TroopId;
  mode: TroopRunMode;
  tier?: number;
  fromTier?: number;
  toTier?: number;
  count: number | "max";
  batches: number;
}

export type TroopAppointmentRank = "regular" | "supreme";

export interface TroopsPlanState {
  runs: TroopRunState[];
  ministerOfEducation?: TroopAppointmentRank;
  vicePresident?: TroopAppointmentRank;
  capacityBoost?: boolean;
  mobilize?: boolean;
  advancedTraining?: boolean;
  savedAt: string;
}

/**
 * A batch that a camp is training or promoting. A camp trains one batch at a time. A training
 * adds `count` troops of `tier`. A promotion moves `count` troops from `fromTier` to `toTier`.
 */
export interface TrainingJobState {
  startedAt: string;
  endsAt: string;
  camp: TroopId;
  mode: TroopRunMode;
  count: number;
  tier?: number;
  fromTier?: number;
  toTier?: number;
  cost?: { itemId: string; amount: number }[];
}
