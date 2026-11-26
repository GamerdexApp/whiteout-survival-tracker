import { translator } from "@/i18n/formatter";
import type { TroopRunState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { MIN_TIER } from "@/data/game/troops";
import { actionMatcher } from "./eventExport";
import type { ExportLine, ExportSpec, UnscoredLine } from "./eventExport";
import { clampTier, promotionTiersOf, tierNumbers } from "./troopsPlan";
import type { TroopsPlanDraft, TroopsPlanResult } from "./troopsPlan";

const TRAIN_ROW = (tier: number) =>
  new RegExp(`^Train 1 Lv\\. ${tier} troop$`, "i");
const TROOP_SPEEDUP_ROW = /^Use 1m (of )?Speedups for (troop )?Training/i;

interface RunTroops {
  run: TroopRunState;
  troops: number;
}

const troopsOfRuns = (
  draft: TroopsPlanDraft,
  result: TroopsPlanResult,
): RunTroops[] => {
  const seen = new Map<string, number>();
  return draft.runs.map((run) => {
    const index = seen.get(run.camp) ?? 0;
    seen.set(run.camp, index + 1);
    const batch = result.calculation.camps[run.camp].runs[index];
    return { run, troops: batch ? batch.troopsPerBatch * batch.batches : 0 };
  });
};

/** The troops that each tier gets from the runs. A promotion gives its troops to the target tier. */
const trainedTroopsOf = (items: RunTroops[]) => {
  const byTier = new Map<number, number>();
  for (const { run, troops } of items) {
    const tier =
      run.mode === "training"
        ? clampTier(run.tier, MIN_TIER)
        : promotionTiersOf(run).toTier;
    byTier.set(tier, (byTier.get(tier) ?? 0) + troops);
  }
  return byTier;
};

export const hasExportLines = (spec: ExportSpec) =>
  spec.groups.some((group) => group.lines.length > 0);

/**
 * Troops trained by tier and the speedup minutes used. They share one event day, so the plan picks
 * one day for both. A day scores a line only where the package lists a row for it.
 */
export const exportSpecOf = (
  draft: TroopsPlanDraft,
  result: TroopsPlanResult,
): ExportSpec => {
  const t = translator("troops");
  const items = troopsOfRuns(draft, result);
  const trained = trainedTroopsOf(items);
  const detail = t("plan.export.computed");

  const trainLines: ExportLine[] = tierNumbers
    .filter((tier) => (trained.get(tier) ?? 0) > 0)
    .map((tier) => ({
      id: `train-${tier}`,
      label: t("plan.export.trainedTier", { tier: formatNumber(tier) }),
      units: trained.get(tier) ?? 0,
      detail,
      matches: actionMatcher(TRAIN_ROW(tier)),
    }));
  const speedupLines: ExportLine[] =
    result.speedupMinutesUsed > 0
      ? [
          {
            id: "speedup-minutes",
            label: t("plan.export.speedupMinutes"),
            units: result.speedupMinutesUsed,
            detail,
            matches: actionMatcher(TROOP_SPEEDUP_ROW),
          },
        ]
      : [];

  const unscoredPower: UnscoredLine[] = [
    {
      id: "power",
      label: t("plan.export.power"),
      units: result.calculation.totalPower.total,
      reason: t("plan.export.powerReason"),
    },
  ];

  return {
    page: "troops",
    groups: [
      {
        id: "trained",
        label: t("plan.export.trainedGroup"),
        lines: [...trainLines, ...speedupLines],
        unscored: unscoredPower,
      },
    ],
  };
};
