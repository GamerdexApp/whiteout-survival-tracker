import { translator } from "@/i18n/formatter";
import type { ExportSpec } from "./eventExport";
import type { ExpertsPlan } from "./experts";

const BOOK_ACTION = "Use 1 Book of Knowledge";
const SIGIL_ACTION = "Use any 1 Expert Sigil (excluding Common Sigils)";

export const expertPlanScores = (plan: ExpertsPlan) =>
  plan.total.books + plan.total.sigils > 0;

export const exportSpecOf = (plan: ExpertsPlan): ExportSpec => {
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
