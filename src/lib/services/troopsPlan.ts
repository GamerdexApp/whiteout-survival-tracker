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
  TROOP_CALCULATOR,
} from "@/data/game/troops";
import type {
  TroopCalculation,
  TroopCalculatorInput,
  TroopCampConfig,
  TroopRun,
} from "@/data/game/troops";
import { chiefBuffs } from "./bonuses";
import { minutesOfSpeedup } from "./inventory";
import type { StockCheck } from "./planStock";
import { campLabelOf, campOf, highestTierOf, TROOP_IDS } from "./troops";

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

const clampTier = (tier: number | undefined, fallback: number) =>
  Math.min(MAX_TIER, Math.max(MIN_TIER, Math.floor(tier ?? fallback)));

const calculatorRun = (run: TroopRunState, capacity: number): TroopRun => {
  const fromTier = Math.min(clampTier(run.fromTier, MIN_TIER), MAX_TIER - 1);
  return {
    action:
      run.mode === "training"
        ? { mode: "training", tier: clampTier(run.tier, MIN_TIER) }
        : {
            mode: "promotion",
            fromTier,
            toTier: Math.max(clampTier(run.toTier, MAX_TIER), fromTier + 1),
          },
    count:
      run.count === "max"
        ? "max"
        : Math.min(Math.max(0, Math.floor(run.count)), capacity),
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
  const general = minutesOfSpeedup(chief, "general");
  return { training, general, total: training + general };
};

/**
 * Runs the package calculator for the draft. A count above the capacity is cut to the capacity,
 * because the calculator rejects it.
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
  const calculation = calculateTroops(
    calculatorInput(
      chief,
      draft,
      bonuses,
      TROOP_IDS.map((camp) =>
        draft.runs
          .filter((run) => run.camp === camp)
          .map((run) => calculatorRun(run, capacity)),
      ),
    ),
  );
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
    {
      id: "troop-time",
      name: t("plan.stock.name"),
      available: troopSpeedupStock(chief).total,
      needed: result.calculation.speedupMinutesNeeded,
      unit: t("plan.stock.minutesUnit"),
    },
  ];
};
