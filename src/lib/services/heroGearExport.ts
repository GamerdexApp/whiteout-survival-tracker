import { translator } from "@/i18n/formatter";
import type { ExportSpec } from "./eventExport";
import type { GearPlanResult } from "./heroGear";

const ESSENCE_STONES_ACTION = "Use 1 Hero Gear Essence Stone";
const MITHRIL_ACTION = "Use 1 Mithril";

/** Essence Stones and Mithril share one group, because SvS Day 4 and 5 score both. */
export const exportSpecOf = (plan: GearPlanResult): ExportSpec => {
  const t = translator("heroGear");
  const items = [
    {
      id: "essence-stones",
      label: t("export.essenceStones"),
      action: ESSENCE_STONES_ACTION,
    },
    { id: "mithril", label: t("export.mithril"), action: MITHRIL_ACTION },
  ];

  const lines = items.flatMap(({ id, label, action }) => {
    const units = plan.resources.get(id) ?? 0;
    return units > 0
      ? [
          {
            id,
            label,
            units,
            matches: (_event: string, text: string) => text === action,
          },
        ]
      : [];
  });

  return {
    page: "heroGear",
    groups: lines.length > 0 ? [{ id: "items", lines }] : [],
  };
};
