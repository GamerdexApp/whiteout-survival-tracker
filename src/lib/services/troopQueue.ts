import { TROOP_CALCULATOR } from "whiteout-survival-data";
import type {
  Playthrough,
  TrainingJobState,
  TroopId,
  TroopRunState,
} from "@/types/app";
import { findItem } from "@/data/game/items";
import { MAX_TIER, MIN_TIER } from "@/data/game/troops";
import { withCostTaken, withTrainingJob } from "./queues";
import type { CostLine } from "./queues";
import { highestTierOf } from "./troops";
import { runTroopsPlan, trainingBonusesOf } from "./troopsPlan";
import type { TroopsPlanDraft } from "./troopsPlan";

export interface TrainingBatch {
  camp: TroopId;
  mode: "training" | "promotion";
  tier: number;
  fromTier: number;
  toTier: number;
  count: number;
}

/** The plan switches that a start can turn on. Every one of them begins off. */
export type TrainingBoosts = Pick<
  TroopsPlanDraft,
  "position" | "rank" | "capacityBoost" | "mobilize" | "advancedTraining"
>;

export const noBoosts: TrainingBoosts = {
  position: "none",
  rank: "regular",
  capacityBoost: false,
  mobilize: false,
  advancedTraining: false,
};

export const draftWithBoosts = (
  boosts: TrainingBoosts,
  runs: TroopRunState[],
): TroopsPlanDraft => ({ runs, ...boosts });

const runOf = (batch: TrainingBatch): TroopRunState => ({
  camp: batch.camp,
  mode: batch.mode,
  ...(batch.mode === "training"
    ? { tier: batch.tier }
    : { fromTier: batch.fromTier, toTier: batch.toTier }),
  count: batch.count,
  batches: 1,
});

/**
 * The troops that one batch can hold. It uses the research capacity of the Bonuses page and the
 * camp levels, and the capacity of the boosts that the start turned on.
 */
export const batchCapacityOf = (chief: Playthrough, boosts = noBoosts) =>
  runTroopsPlan(chief, draftWithBoosts(boosts, [])).calculation.capacity;

export interface BatchEstimate {
  speedPercent: number;
  packageSeconds: number;
  seconds: number;
  cost: CostLine[];
}

/**
 * The time and cost of one batch from the package calculator. The package time is the time with
 * no speed bonus, and the time with the training speed of the Bonuses page and of the boosts that
 * the start turned on follows from it. The package time keeps the capacity of the boosts, so a
 * batch is not cut where the time with the boosts is not.
 */
export const estimateBatch = (
  chief: Playthrough,
  batch: TrainingBatch,
  boosts = noBoosts,
): BatchEstimate => {
  const bonuses = trainingBonusesOf(chief);
  const draft = draftWithBoosts(boosts, [runOf(batch)]);
  const withSpeed = runTroopsPlan(chief, draft, bonuses);
  const withoutSpeed = runTroopsPlan(
    chief,
    { ...draft, position: "none", mobilize: false, advancedTraining: false },
    {
      capacity: bonuses.capacity + withSpeed.appointment.capacity,
      speedPercent: 0,
    },
  );
  return {
    speedPercent:
      bonuses.speedPercent +
      withSpeed.appointment.speedPercent +
      (boosts.mobilize ? TROOP_CALCULATOR.mobilizeSpeedPercent : 0) +
      (boosts.advancedTraining
        ? TROOP_CALCULATOR.advancedTrainingSpeedPercent
        : 0),
    packageSeconds: withoutSpeed.runSeconds[0] ?? 0,
    seconds: withSpeed.runSeconds[0] ?? 0,
    cost: withSpeed.calculation.resources.map((line) => ({
      itemId: line.itemId,
      name: findItem(line.itemId)?.name ?? line.itemId,
      amount: line.amount,
    })),
  };
};

/**
 * The tiers a camp can train now. A tier above the highest tier of the camp is locked.
 */
export const trainableTiers = (chief: Playthrough, camp: TroopId) => {
  const highest = highestTierOf(chief, camp);
  return Array.from(
    { length: Math.max(0, Math.min(highest, MAX_TIER) - MIN_TIER + 1) },
    (_, index) => MIN_TIER + index,
  );
};

export interface StartTrainingInput {
  batch: TrainingBatch;
  cost: CostLine[];
  startedAt: Date;
  endsAt: Date;
  takeCost: boolean;
}

export const startTraining = (
  chief: Playthrough,
  input: StartTrainingInput,
): Playthrough => {
  const { batch } = input;
  const job: TrainingJobState = {
    startedAt: input.startedAt.toISOString(),
    endsAt: input.endsAt.toISOString(),
    camp: batch.camp,
    mode: batch.mode,
    count: batch.count,
    ...(batch.mode === "training"
      ? { tier: batch.tier }
      : { fromTier: batch.fromTier, toTier: batch.toTier }),
    cost: input.cost.map((line) => ({
      itemId: line.itemId,
      amount: line.amount,
    })),
  };
  const charged = input.takeCost ? withCostTaken(chief, input.cost) : chief;
  return withTrainingJob(charged, job);
};
