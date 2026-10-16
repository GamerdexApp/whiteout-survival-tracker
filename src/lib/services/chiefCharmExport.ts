import { translator } from "@/i18n/formatter";
import type { LadderPlan } from "./chiefGearExport";
import { scoreExportOf } from "./chiefGearExport";
import type { ExportSpec } from "./eventExport";

const CHARM_SCORE_ROW = /^Raise Chief Charm max score by 1$/;

export const exportSpecOf = (plan: LadderPlan): ExportSpec =>
  scoreExportOf(
    "chiefCharms",
    translator("chiefGear")("plan.export.charmScore"),
    CHARM_SCORE_ROW,
    plan.total,
  );
