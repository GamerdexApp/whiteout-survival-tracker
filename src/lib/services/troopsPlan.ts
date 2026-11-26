import { translator } from "@/i18n/formatter";
import type {
  Playthrough,
  TroopAppointmentRank,
  TroopId,
  TroopRunMode,
  TroopRunState,
} from "@/types/app";
import {
  calculateTroops,
  campBuildingId,
  MAX_TIER,
  MIN_TIER,
  trainingSecondsOf,
  TROOP_CALCULATOR,
} from "@/data/game/troops";
import type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopRun,
} from "@/data/game/troops";
import { chiefBuffs } from "./bonuses";
import { BASE_RESOURCE_IDS } from "./coreResources";
import { generalMinutesApplied, minutesOfSpeedup } from "./inventory";
import { itemChecks } from "./planStock";
import type { StockCheck } from "./planStock";
import {
  campLabelOf,
  campOf,
  countOf,
  highestTierOf,
  TROOP_IDS,
} from "./troops";

export type TroopPosition = "none" | "ministerOfEducation" | "vicePresident";

export interface TroopsPlanDraft {
  runs: TroopRunState[];
  position: TroopPosition;
  rank: TroopAppointmentRank;
  capacityBoost: boolean;
  mobilize: boolean;
  advancedTraining: boolean;
}

const positionOf = (chief: Playthrough): TroopPosition => {
  if (chief.troopsPlan?.ministerOfEducation) return "ministerOfEducation";
  if (chief.troopsPlan?.vicePresident) return "vicePresident";
  return "none";
};

export const draftOfSavedPlan = (chief: Playthrough): TroopsPlanDraft => {
  const plan = chief.troopsPlan;
  return {
    runs: plan?.runs ?? [],
    position: positionOf(chief),
    rank: plan?.ministerOfEducation ?? plan?.vicePresident ?? "regular",
    capacityBoost: plan?.capacityBoost ?? false,
    mobilize: plan?.mobilize ?? false,
    advancedTraining: plan?.advancedTraining ?? false,
  };
};

export const withSavedTroopsPlan = (
  chief: Playthrough,
  draft: TroopsPlanDraft,
  savedAt: string,
): Playthrough => ({
  ...chief,
  troopsPlan: {
    runs: draft.runs,
    ...(draft.position === "ministerOfEducation" && {
      ministerOfEducation: draft.rank,
    }),
    ...(draft.position === "vicePresident" && { vicePresident: draft.rank }),
    capacityBoost: draft.capacityBoost,
    mobilize: draft.mobilize,
    advancedTraining: draft.advancedTraining,
    savedAt,
  },
});

export const tierNumbers = Array.from(
  { length: MAX_TIER - MIN_TIER + 1 },
  (_, index) => MIN_TIER + index,
);

export const newRun = (
  chief: Playthrough,
  camp: TroopId,
  mode: TroopRunMode,
): TroopRunState => {
  const highest = Math.max(MIN_TIER, highestTierOf(chief, camp));
  return mode === "training"
    ? { camp, mode, tier: highest, count: "max", batches: 1 }
    : {
        camp,
        mode,
        fromTier: Math.max(MIN_TIER, highest - 1),
        toTier: Math.max(MIN_TIER + 1, highest),
        count: "max",
        batches: 1,
      };
};

export const withRunMode = (
  chief: Playthrough,
  run: TroopRunState,
  mode: TroopRunMode,
): TroopRunState => ({
  ...newRun(chief, run.camp, mode),
  count: run.count,
  batches: run.batches,
});

export const withPromotionFrom = (
  run: TroopRunState,
  fromTier: number,
): TroopRunState => ({
  ...run,
  fromTier,
  toTier: Math.max(run.toTier ?? fromTier + 1, fromTier + 1),
});

export const withPromotionTo = (
  run: TroopRunState,
  toTier: number,
): TroopRunState => ({
  ...run,
  toTier,
  fromTier: Math.min(run.fromTier ?? toTier - 1, toTier - 1),
});

export interface TrainingBonuses {
  capacity: number;
  speedPercent: number;
}

/**
 * The research capacity and the game training speed from the Bonuses page. The calculator adds
 * the camp capacity itself, so the camp sources are left out of the capacity. A stat the chief
 * has no source for counts as 0.
 */
export const trainingBonusesOf = (chief: Playthrough): TrainingBonuses => {
  const categories = chiefBuffs(chief).categories;
  const campIds = TROOP_IDS.map(campBuildingId);
  const capacity = categories.find(
    (category) => category.statKey === "training-capacity",
  );
  const speed = categories.find(
    (category) => category.statKey === "training-speed",
  );
  return {
    capacity: (capacity?.sources ?? [])
      .filter((source) => !campIds.includes(source.id))
      .reduce((sum, source) => sum + source.amount, 0),
    speedPercent: speed?.total ?? 0,
  };
};

export interface AppointmentEffect {
  capacity: number;
  speedPercent: number;
}

export const appointmentEffect = (
  position: TroopPosition,
  rank: TroopAppointmentRank,
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

export interface TroopsPlanResult {
  calculation: TroopCalculation;
  bonuses: TrainingBonuses;
  appointment: AppointmentEffect;
  runSeconds: number[];
  speedupMinutesUsed: number;
}

const campLevelOf = (chief: Playthrough, camp: TroopId) =>
  campLabelOf(chief, camp) ?? campOf(camp).levels[0].label;

export const clampTier = (tier: number | undefined, fallback: number) =>
  Math.min(MAX_TIER, Math.max(MIN_TIER, Math.floor(tier ?? fallback)));

export const promotionTiersOf = (run: TroopRunState) => {
  const fromTier = Math.min(clampTier(run.fromTier, MIN_TIER), MAX_TIER - 1);
  return {
    fromTier,
    toTier: Math.max(clampTier(run.toTier, MAX_TIER), fromTier + 1),
  };
};

/**
 * The troops that one promotion batch can hold. A promotion takes the time between its two tiers,
 * so the batch grows by the training time of the target tier over that step time.
 */
export const promotionCapacity = (
  capacity: number,
  camp: TroopId,
  fromTier: number,
  toTier: number,
) => {
  const toSeconds = trainingSecondsOf(camp, toTier);
  const stepSeconds = toSeconds - trainingSecondsOf(camp, fromTier);
  return stepSeconds <= 0
    ? capacity
    : Math.ceil((capacity * toSeconds) / stepSeconds);
};

/** The troops that one batch of the run can hold. */
export const runCapacityOf = (run: TroopRunState, capacity: number) => {
  if (run.mode === "training") return capacity;
  const { fromTier, toTier } = promotionTiersOf(run);
  return promotionCapacity(capacity, run.camp, fromTier, toTier);
};

/** The troops the chief holds at the tier that a promotion run takes from. Null for training. */
export const promotableOf = (chief: Playthrough, run: TroopRunState) =>
  run.mode === "promotion"
    ? countOf(chief, run.camp, promotionTiersOf(run).fromTier)
    : null;

/**
 * The most troops that one batch of the run takes: the batch capacity, and for a promotion no more
 * than the chief holds at the lower tier.
 */
export const runLimitOf = (
  chief: Playthrough,
  run: TroopRunState,
  capacity: number,
) => {
  const batchCapacity = runCapacityOf(run, capacity);
  const held = promotableOf(chief, run);
  return held === null ? batchCapacity : Math.min(batchCapacity, held);
};

const calculatorRun = (
  chief: Playthrough,
  run: TroopRunState,
  capacity: number,
): TroopRun => {
  const runCapacity = runLimitOf(chief, run, capacity);
  return {
    action:
      run.mode === "training"
        ? { mode: "training", tier: clampTier(run.tier, MIN_TIER) }
        : { mode: "promotion", ...promotionTiersOf(run) },
    count:
      run.count === "max"
        ? runCapacity
        : Math.min(Math.max(0, Math.floor(run.count)), runCapacity),
    batches: Math.max(1, Math.floor(run.batches)),
  };
};

const calculatorInput = (
  chief: Playthrough,
  draft: TroopsPlanDraft,
  bonuses: TrainingBonuses,
  runs: TroopRun[][],
): TroopCalculatorInput => ({
  camps: Object.fromEntries(
    TROOP_IDS.map((camp, index): [TroopId, TroopCampConfig] => [
      camp,
      { level: campLevelOf(chief, camp), runs: runs[index] },
    ]),
  ) as Record<TroopId, TroopCampConfig>,
  researchCapacity: bonuses.capacity,
  trainingSpeedPercent: bonuses.speedPercent,
  capacityBoost: draft.capacityBoost,
  mobilize: draft.mobilize,
  advancedTraining: draft.advancedTraining,
  ministerOfEducation:
    draft.position === "ministerOfEducation" ? draft.rank : undefined,
  vicePresident: draft.position === "vicePresident" ? draft.rank : undefined,
});

export const troopSpeedupStock = (chief: Playthrough) => {
  const training = minutesOfSpeedup(chief, "troop");
  const general = generalMinutesApplied(chief, "troops");
  return { training, general, total: training + general };
};

/**
 * Runs the package calculator for the draft. A count above the limit of its run is cut to it. A
 * promotion batch can hold more than the capacity of the calculator, which rejects a larger count,
 * so the calculator runs with a capacity wide enough for the largest batch.
 */
export const runTroopsPlan = (
  chief: Playthrough,
  draft: TroopsPlanDraft,
  bonusesOverride?: TrainingBonuses,
): TroopsPlanResult => {
  const bonuses = bonusesOverride ?? trainingBonusesOf(chief);
  const { capacity } = calculateTroops(
    calculatorInput(chief, draft, bonuses, [[], [], []]),
  );
  const runs = TROOP_IDS.map((camp) =>
    draft.runs
      .filter((run) => run.camp === camp)
      .map((run) => calculatorRun(chief, run, capacity)),
  );
  const widest = Math.max(
    capacity,
    ...runs.flat().map((run) => Number(run.count)),
  );
  const boost = draft.capacityBoost
    ? TROOP_CALCULATOR.capacityBoostMultiplier
    : 1;
  const widened = {
    ...bonuses,
    capacity: bonuses.capacity + Math.ceil((widest - capacity) / boost),
  };
  const calculation = {
    ...calculateTroops(calculatorInput(chief, draft, widened, runs)),
    capacity,
  };
  const seen = new Map<TroopId, number>();
  const runSeconds = draft.runs.map((run) => {
    const index = seen.get(run.camp) ?? 0;
    seen.set(run.camp, index + 1);
    return calculation.camps[run.camp].runs[index]?.seconds ?? 0;
  });
  return {
    calculation,
    bonuses,
    appointment: appointmentEffect(draft.position, draft.rank),
    runSeconds,
    speedupMinutesUsed: Math.min(
      troopSpeedupStock(chief).total,
      calculation.speedupMinutesNeeded,
    ),
  };
};

export const troopsStockChecks = (
  chief: Playthrough,
  result: TroopsPlanResult,
): StockCheck[] => {
  const t = translator("troops");
  return [
    ...itemChecks(
      BASE_RESOURCE_IDS.map((itemId) => ({
        itemId,
        amount:
          result.calculation.resources.find(
            (resource) => resource.itemId === itemId,
          )?.amount ?? 0,
      })),
      chief,
    ),
    {
      id: "troop-time",
      name: t("plan.stock.name"),
      available: troopSpeedupStock(chief).total,
      needed: result.calculation.speedupMinutesNeeded,
      unit: t("plan.stock.minutesUnit"),
    },
  ];
};
