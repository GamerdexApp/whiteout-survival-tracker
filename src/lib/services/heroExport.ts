import { translator } from "@/i18n/formatter";
import type { Hero } from "whiteout-survival-data";
import { heroRarities } from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import type { ExportGroup, ExportLine, ExportSpec } from "./eventExport";
import type { HeroPlanResult } from "./heroes";

const SHARD_ACTION_RARITY: Record<Hero["rarity"], string> = {
  Legendary: "Mythic",
  Epic: "Epic",
  Rare: "Rare",
};

const WIDGET_ACTION = "Use 1 Widget of any Hero Exclusive Gear";
const MANUAL_ITEM_SUFFIX = "-skill-manual";

const shardLinesOf = (plan: HeroPlanResult): ExportLine[] => {
  const t = translator("heroes");
  return heroRarities.flatMap((rarity) => {
    const rows = plan.rows.filter((row) => row.view.hero.rarity === rarity);
    const units = rows.reduce(
      (total, row) => total + row.calculation.stars.shards,
      0,
    );
    if (units === 0) return [];
    const action = `Use 1 ${SHARD_ACTION_RARITY[rarity]} Hero Shard to ascend Heroes`;
    return [
      {
        id: `shards-${rarity}`,
        label: t(`export.shards.${rarity}`),
        units,
        detail: rows
          .filter((row) => row.calculation.stars.shards > 0)
          .map((row) => row.view.hero.name)
          .join(", "),
        matches: (_event, text) => text === action,
      },
    ];
  });
};

const manualLinesOf = (plan: HeroPlanResult) => {
  const t = translator("heroes");
  return [...plan.resources.entries()]
    .filter(([itemId]) => itemId.endsWith(MANUAL_ITEM_SUFFIX))
    .map(([itemId, units]) => ({
      id: itemId,
      label: findItem(itemId)?.name ?? itemId,
      units,
      reason: t("export.manualsReason"),
    }));
};

/**
 * Shards and Widgets are two groups because no SvS day scores both. The groups keep only the
 * items the plan needs, so a plan without Widgets has no Widgets day.
 */
export const exportSpecOf = (plan: HeroPlanResult): ExportSpec => {
  const t = translator("heroes");
  const shardLines = shardLinesOf(plan);
  const unscored = manualLinesOf(plan).filter((item) => item.units > 0);
  const groups: ExportGroup[] = [];

  if (shardLines.length > 0) {
    groups.push({
      id: "shards",
      label: t("export.shardsGroup"),
      lines: shardLines,
      unscored,
    });
  }
  if (plan.widgets > 0) {
    groups.push({
      id: "widgets",
      label: t("export.widgetsGroup"),
      lines: [
        {
          id: "widgets",
          label: t("export.widgets"),
          units: plan.widgets,
          matches: (_event, text) => text === WIDGET_ACTION,
        },
      ],
      unscored: groups.length === 0 ? unscored : undefined,
    });
  }

  return { page: "heroes", groups };
};
