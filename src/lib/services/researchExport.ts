import { translator } from "@/i18n/formatter";
import type { ResearchCalculation } from "whiteout-survival-data";
import { findItem } from "@/data/game/items";
import { findResearch } from "@/data/game/research";
import { actionMatcher } from "./eventExport";
import type { ExportSpec, ExportUpgrade, UnscoredLine } from "./eventExport";
import type { ResearchPlanRow } from "./researchPlan";

const FIRE_CRYSTAL_SHARD_ID = "fire-crystal-shard";

const costOrderOf = (itemId: string) =>
  itemId === FIRE_CRYSTAL_SHARD_ID ? 0 : 1;

const upgradeOf = (row: ResearchPlanRow): ExportUpgrade | null => {
  const node = findResearch(row.id);
  if (!node) return null;
  const reached = node.levels.filter(
    (level) => level.level > row.current && level.level <= row.goal,
  );
  const cost = new Map<string, number>();
  for (const level of reached) {
    for (const part of level.cost) {
      cost.set(part.itemId, (cost.get(part.itemId) ?? 0) + part.amount);
    }
  }
  return {
    page: "research",
    item: node.name,
    itemId: node.id,
    from: String(row.current),
    to: String(row.goal),
    cost: [...cost]
      .map(([itemId, amount]) => ({ itemId, amount }))
      .sort((a, b) => costOrderOf(a.itemId) - costOrderOf(b.itemId)),
    power: reached.reduce((sum, level) => sum + level.power, 0),
  };
};

/**
 * What the Research plan scores in the four events. The package returns no event points for
 * research, so every line is the plan result times the scoring rows.
 */
export const exportSpecOf = (
  rows: ResearchPlanRow[],
  calculation: ResearchCalculation,
): ExportSpec => {
  const t = translator("research");
  const computedByApp = t("plan.export.computed");
  const shards =
    calculation.resources.find(
      (resource) => resource.itemId === FIRE_CRYSTAL_SHARD_ID,
    )?.amount ?? 0;
  const unscored: UnscoredLine[] = calculation.resources
    .filter((resource) => resource.itemId !== FIRE_CRYSTAL_SHARD_ID)
    .map((resource) => {
      const name = findItem(resource.itemId)?.name ?? resource.itemId;
      return {
        id: resource.itemId,
        label: name,
        units: resource.amount,
        reason: t("plan.export.unscored", { name }),
      };
    });

  return {
    page: "research",
    groups: [
      {
        id: "research",
        lines: [
          {
            id: FIRE_CRYSTAL_SHARD_ID,
            label:
              findItem(FIRE_CRYSTAL_SHARD_ID)?.name ?? FIRE_CRYSTAL_SHARD_ID,
            units: shards,
            detail: computedByApp,
            matches: actionMatcher(/^Use 1 Fire Crystal Shard for Research$/),
          },
          {
            id: "speedup-minutes",
            label: t("plan.export.speedupMinutes"),
            units: calculation.speedupMinutesNeeded,
            detail: computedByApp,
            matches: actionMatcher(/^Use 1m (of )?Speedups for Research/),
          },
          {
            id: "power",
            label: t("plan.export.power"),
            units: calculation.power,
            detail: computedByApp,
            matches: actionMatcher(/^Raise 1 Power through Research$/),
          },
        ],
        unscored,
      },
    ],
    upgrades: rows.flatMap((row) => {
      const upgrade = upgradeOf(row);
      return upgrade ? [upgrade] : [];
    }),
  };
};
