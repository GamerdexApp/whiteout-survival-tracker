import { translator } from "@/i18n/formatter";
import type { Playthrough } from "@/types/app";
import { actionMatcher } from "./eventExport";
import type { ExportSpec } from "./eventExport";
import { learningMinutesUsed } from "./experts";
import type { ExpertsPlan } from "./experts";

const BOOK_ACTION = "Use 1 Book of Knowledge";
const SIGIL_ACTION = "Use any 1 Expert Sigil (excluding Common Sigils)";
const LEARNING_SPEEDUP_ROW = /^Use 1m (of )?Speedups to Learn Expert Skills/i;

export const expertPlanScores = (plan: ExpertsPlan, chief: Playthrough) =>
  plan.total.books + plan.total.sigils + learningMinutesUsed(plan, chief) > 0;

/**
 * Books, sigils and the learning speedup minutes share one event day, because the days that score
 * the books and the sigils also score the speedups.
 */
export const exportSpecOf = (
  plan: ExpertsPlan,
  chief: Playthrough,
): ExportSpec => {
  const t = translator("experts");
  return {
    page: "experts",
    groups: [
      {
        id: "items",
        lines: [
          {
            id: "books",
            label: t("plan.export.books"),
            units: plan.total.books,
            matches: (_event, action) => action === BOOK_ACTION,
          },
          {
            id: "sigils",
            label: t("plan.export.sigils"),
            units: plan.total.sigils,
            matches: (_event, action) => action === SIGIL_ACTION,
          },
          {
            id: "learning-speedups",
            label: t("plan.export.learningSpeedups"),
            units: learningMinutesUsed(plan, chief),
            matches: actionMatcher(LEARNING_SPEEDUP_ROW),
          },
        ],
        unscored: [
          {
            id: "exp",
            label: t("plan.export.exp"),
            units: plan.total.exp,
            reason: t("plan.export.expReason"),
          },
        ],
      },
    ],
  };
};
