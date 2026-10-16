import { translator } from "@/i18n/formatter";
import type { LadderResult, PlanItemResult } from "./chiefGear";
import { actionMatcher } from "./eventExport";
import type { ExportSpec } from "./eventExport";

export interface LadderPlan {
  total: LadderResult;
  byItem: PlanItemResult[];
}

/**
 * The score of a Chief Gear or Chief Charms plan is paid once per point by the rows "Raise Chief
 * Gear max score by 1" and "Raise Chief Charm max score by 1". Power gained is not scored.
 */
export const scoreExportOf = (
  page: string,
  scoreLabel: string,
  scoreRow: RegExp,
  total: LadderResult,
): ExportSpec => {
  const t = translator("chiefGear");
  return {
    page,
    groups: [
      {
        id: "score",
        lines: [
          {
            id: "score",
            label: scoreLabel,
            units: total.score,
            matches: actionMatcher(scoreRow),
          },
        ],
        unscored: [
          {
            id: "power",
            label: t("plan.export.power"),
            units: total.power,
            reason: t("plan.export.powerReason"),
          },
        ],
      },
    ],
  };
};

const GEAR_SCORE_ROW = /^Raise (max )?Chief Gear (max )?score by 1/;

export const exportSpecOf = (plan: LadderPlan): ExportSpec => ({
  ...scoreExportOf(
    "chiefGear",
    translator("chiefGear")("plan.export.gearScore"),
    GEAR_SCORE_ROW,
    plan.total,
  ),
  upgrades: plan.byItem.map(({ item, result }) => ({
    page: "chiefGear",
    item: item.label,
    itemId: item.slotId,
    from: item.current,
    to: item.goal as string,
    cost: result.materials,
    power: result.power,
  })),
});
