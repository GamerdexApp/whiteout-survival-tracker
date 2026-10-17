import {
  calculateTroops,
  campLevelsOf,
  TROOP_CALCULATOR,
  TROOP_EVENT_KEYS,
  TROOP_TYPES,
  troopEventNameOf,
} from "@/data/game/calcTroop";
import type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopEventKey,
  TroopRun,
  TroopType,
} from "@/data/game/calcTroop";

export type CampMode = "none" | "training" | "promotion" | "both";
export type RunKind = "training" | "promotion";
export type RunCount = number | "max";
export type AppointmentPosition =
  "none" | "ministerOfEducation" | "vicePresident";
export type AppointmentRank = "regular" | "supreme";

export interface TrainingRunInput {
  tier: number;
  count: RunCount;
  batches: number;
}

export interface PromotionRunInput {
  fromTier: number;
  toTier: number;
  count: RunCount;
  batches: number;
}

export interface CampInput {
  level: string;
  mode: CampMode;
  training: TrainingRunInput;
  promotion: PromotionRunInput;
}

export interface TroopCalculatorState {
  camps: Record<TroopType, CampInput>;
  researchCapacity: number;
  position: AppointmentPosition;
  rank: AppointmentRank;
  capacityBoost: boolean;
  trainingSpeedPercent: number;
  mobilize: boolean;
  advancedTraining: boolean;
  costReductionPercent: Record<TroopType, number>;
}

export const CAMP_MODES: CampMode[] = ["none", "training", "promotion", "both"];
export const APPOINTMENT_POSITIONS: AppointmentPosition[] = [
  "none",
  "ministerOfEducation",
  "vicePresident",
];
export const APPOINTMENT_RANKS: AppointmentRank[] = ["regular", "supreme"];

export const MAX_RESEARCH_CAPACITY = 99_999;
export const MAX_BATCHES = 999;
export const MAX_TRAINING_SPEED_PERCENT = 9_999;
export const MAX_COST_REDUCTION_PERCENT =
  TROOP_CALCULATOR.maxCostReductionPercent;

const { minTier, maxTier } = TROOP_CALCULATOR;

const tiersBetween = (low: number, high: number) =>
  Array.from({ length: high - low + 1 }, (_, index) => low + index);

export const trainingTiers = tiersBetween(minTier, maxTier);
export const promotionFromTiers = tiersBetween(minTier, maxTier - 1);
export const promotionToTiers = (fromTier: number) =>
  tiersBetween(fromTier + 1, maxTier);

const DEFAULT_CAMP_LEVEL = "30";
const DEFAULT_TIER = 10;

const initialCamp = (): CampInput => ({
  level: DEFAULT_CAMP_LEVEL,
  mode: "training",
  training: { tier: DEFAULT_TIER, count: "max", batches: 1 },
  promotion: {
    fromTier: DEFAULT_TIER - 1,
    toTier: DEFAULT_TIER,
    count: "max",
    batches: 1,
  },
});

const perType = <Value>(valueOf: (type: TroopType) => Value) =>
  Object.fromEntries(
    TROOP_TYPES.map((type) => [type, valueOf(type)]),
  ) as Record<TroopType, Value>;

export const initialTroopCalculatorState = (): TroopCalculatorState => ({
  camps: perType(initialCamp),
  researchCapacity: 0,
  position: "none",
  rank: "regular",
  capacityBoost: false,
  trainingSpeedPercent: 0,
  mobilize: false,
  advancedTraining: false,
  costReductionPercent: perType(() => 0),
});

export const withPromotionFrom = (
  run: PromotionRunInput,
  fromTier: number,
): PromotionRunInput => ({
  ...run,
  fromTier,
  toTier: Math.max(run.toTier, fromTier + 1),
});

/** The run kinds of a camp, in the order the calculator gets them. */
export const runKindsOf = (mode: CampMode): RunKind[] => {
  if (mode === "both") return ["training", "promotion"];
  if (mode === "none") return [];
  return [mode];
};

/** A typed count above the shared capacity is cut to it, since the calculator rejects it. */
export const countWithin = (count: RunCount, capacity: number): RunCount =>
  count === "max" ? "max" : Math.min(count, capacity);

const runOf = (camp: CampInput, kind: RunKind, capacity: number): TroopRun =>
  kind === "training"
    ? {
        action: { mode: "training", tier: camp.training.tier },
        count: countWithin(camp.training.count, capacity),
        batches: camp.training.batches,
      }
    : {
        action: {
          mode: "promotion",
          fromTier: camp.promotion.fromTier,
          toTier: camp.promotion.toTier,
        },
        count: countWithin(camp.promotion.count, capacity),
        batches: camp.promotion.batches,
      };

const calculatorInput = (
  state: TroopCalculatorState,
  runsOf: (camp: CampInput) => TroopRun[],
): TroopCalculatorInput => ({
  camps: perType((type): TroopCampConfig => ({
    level: state.camps[type].level,
    runs: runsOf(state.camps[type]),
  })),
  researchCapacity: state.researchCapacity,
  capacityBoost: state.capacityBoost,
  trainingSpeedPercent: state.trainingSpeedPercent,
  mobilize: state.mobilize,
  advancedTraining: state.advancedTraining,
  ministerOfEducation:
    state.position === "ministerOfEducation" ? state.rank : undefined,
  vicePresident: state.position === "vicePresident" ? state.rank : undefined,
  costReductionPercent: state.costReductionPercent,
});

/**
 * Runs the package calculator twice: once without runs to learn the shared capacity, then with
 * every count cut to that capacity.
 */
export const runTroopCalculator = (
  state: TroopCalculatorState,
): TroopCalculation => {
  const { capacity } = calculateTroops(calculatorInput(state, () => []));
  return calculateTroops(
    calculatorInput(state, (camp) =>
      runKindsOf(camp.mode).map((kind) => runOf(camp, kind, capacity)),
    ),
  );
};

export const campLevelOptions = perType(campLevelsOf);

export interface AppointmentEffect {
  capacity: number;
  speedPercent: number;
}

export const appointmentEffectOf = (
  position: AppointmentPosition,
  rank: AppointmentRank,
): AppointmentEffect => {
  if (position === "ministerOfEducation") {
    return {
      capacity: TROOP_CALCULATOR.ministerOfEducation.capacity[rank],
      speedPercent: TROOP_CALCULATOR.ministerOfEducation.speedPercent[rank],
    };
  }
  if (position === "vicePresident") {
    return {
      capacity: 0,
      speedPercent: TROOP_CALCULATOR.vicePresidentSpeedPercent[rank],
    };
  }
  return { capacity: 0, speedPercent: 0 };
};

export interface TroopEventRow {
  key: TroopEventKey;
  name: string;
  trainingPoints: number;
  /** Absent for an event that gives no points for training speedups. */
  speedup?: { pointsPerMinute: number; points: number };
  total: number;
}

export const troopEventRows = (
  calculation: TroopCalculation,
): TroopEventRow[] =>
  TROOP_EVENT_KEYS.map((key) => {
    const trainingPoints = calculation.eventPoints[key];
    const name = troopEventNameOf(key);
    if (key === "hallOfChief") {
      return { key, name, trainingPoints, total: trainingPoints };
    }
    const pointsPerMinute = calculation.speedupPointsPerMinute[key];
    const points = pointsPerMinute * calculation.speedupMinutesNeeded;
    return {
      key,
      name,
      trainingPoints,
      speedup: { pointsPerMinute, points },
      total: trainingPoints + points,
    };
  });

export const changedTierRows = (rows: TroopCalculation["tiers"]) =>
  rows.filter((row) => TROOP_TYPES.some((type) => row[type] !== 0));

export const hasPromotion = (state: TroopCalculatorState) =>
  TROOP_TYPES.some((type) =>
    runKindsOf(state.camps[type].mode).includes("promotion"),
  );

export const hasAnyRun = (state: TroopCalculatorState) =>
  TROOP_TYPES.some((type) => state.camps[type].mode !== "none");
