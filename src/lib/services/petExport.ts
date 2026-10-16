import { translator } from "@/i18n/formatter";
import type { Playthrough } from "@/types/app";
import type { ExportSpec } from "./eventExport";
import { ownedCount } from "./inventory";
import type { PetPlanResult } from "./pets";

const ADVANCEMENT_ACTION = "Pet advancement score increases by 1";
const COMMON_MARK_ACTION = "Use 1 Common Wild Mark to refine pets";
const ADVANCED_MARK_ACTION = "Use 1 Advanced Wild Mark to refine pets";

export const petPlanScores = (plan: PetPlanResult) =>
  plan.total.advancementScore > 0;

export const exportSpecOf = (
  plan: PetPlanResult,
  chief: Playthrough,
): ExportSpec => {
  const t = translator("pets");
  return {
    page: "pets",
    groups: [
      {
        id: "items",
        lines: [
          {
            id: "advancement",
            label: t("plan.export.advancement"),
            units: plan.total.advancementScore,
            matches: (_event, action) => action === ADVANCEMENT_ACTION,
          },
          {
            id: "commonMark",
            label: t("plan.export.commonMark"),
            units: ownedCount(chief, "common-wild-mark"),
            detail: t("plan.export.marksDetail"),
            matches: (_event, action) => action === COMMON_MARK_ACTION,
          },
          {
            id: "advancedMark",
            label: t("plan.export.advancedMark"),
            units: ownedCount(chief, "advanced-wild-mark"),
            detail: t("plan.export.marksDetail"),
            matches: (_event, action) => action === ADVANCED_MARK_ACTION,
          },
        ],
      },
    ],
  };
};
