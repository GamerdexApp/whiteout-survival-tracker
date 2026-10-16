import { translator } from "@/i18n/formatter";
import type { BuildingCalculation, BuildingStep } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { findBuildingById } from "@/data/game/buildings";
import { findItem } from "@/data/game/items";
import { actionMatcher } from "./eventExport";
import type {
  ExportLine,
  ExportSpec,
  ExportUpgrade,
  UnscoredLine,
} from "./eventExport";
import { constructionSpeedupMinutes, ownedCount } from "./inventory";

const FIRE_CRYSTAL_ID = "fire-crystal";
const REFINED_FIRE_CRYSTAL_ID = "refined-fire-crystal";
const SCORED_RESOURCE_IDS = [FIRE_CRYSTAL_ID, REFINED_FIRE_CRYSTAL_ID];
const COST_ORDER = SCORED_RESOURCE_IDS;

const neededOf = (calculation: BuildingCalculation, itemId: string) =>
  calculation.resources.find((resource) => resource.itemId === itemId)
    ?.amount ?? 0;

const costOrderOf = (itemId: string) => {
  const index = COST_ORDER.indexOf(itemId);
  return index === -1 ? COST_ORDER.length : index;
};

const upgradeOf = (steps: BuildingStep[]): ExportUpgrade | null => {
  const first = steps[0];
  const building = findBuildingById(first.buildingId);
  if (!building) return null;
  const firstOrder = building.levels.find(
    (level) => level.label === first.level,
  )?.order;
  const before = building.levels.find(
    (level) => level.order === (firstOrder ?? 0) - 1,
  );
  const cost = new Map<string, number>();
  for (const step of steps) {
    for (const part of step.cost) {
      cost.set(part.itemId, (cost.get(part.itemId) ?? 0) + part.amount);
    }
  }
  return {
    page: "buildings",
    item: first.name,
    itemId: first.buildingId,
    from: before?.label ?? null,
    to: steps[steps.length - 1].level,
    cost: [...cost]
      .map(([itemId, amount]) => ({ itemId, amount }))
      .sort((a, b) => costOrderOf(a.itemId) - costOrderOf(b.itemId)),
    power: steps.reduce((sum, step) => sum + step.power, 0),
  };
};

const upgradesOf = (calculation: BuildingCalculation): ExportUpgrade[] => {
  const stepsByBuilding = new Map<string, BuildingStep[]>();
  for (const step of calculation.steps) {
    stepsByBuilding.set(step.buildingId, [
      ...(stepsByBuilding.get(step.buildingId) ?? []),
      step,
    ]);
  }
  return [...stepsByBuilding.values()].flatMap((steps) => {
    const upgrade = upgradeOf(steps);
    return upgrade ? [upgrade] : [];
  });
};

/**
 * What the Buildings plan scores in the four events. Crystals and speedup minutes are capped at
 * the stock of the chief, because only spent items score. Power is not capped.
 */
export const exportSpecOf = (
  chief: Playthrough,
  calculation: BuildingCalculation,
): ExportSpec => {
  const t = translator("buildings");
  const crystalLine = (
    id: string,
    itemId: string,
    pattern: RegExp,
  ): ExportLine => {
    const needed = neededOf(calculation, itemId);
    const held = ownedCount(chief, itemId);
    return {
      id,
      label: findItem(itemId)?.name ?? itemId,
      units: Math.min(needed, held),
      detail: t("plan.export.stockDetail", {
        needed: formatNumber(needed),
        held: formatNumber(held),
      }),
      matches: actionMatcher(pattern),
    };
  };
  const heldMinutes = constructionSpeedupMinutes(chief);
  const lines: ExportLine[] = [
    crystalLine(
      FIRE_CRYSTAL_ID,
      FIRE_CRYSTAL_ID,
      /^Use 1 Fire Crystal to upgrade buildings$/,
    ),
    crystalLine(
      REFINED_FIRE_CRYSTAL_ID,
      REFINED_FIRE_CRYSTAL_ID,
      /^Use 1 Refined Fire Crystal to upgrade buildings$/,
    ),
    {
      id: "speedup-minutes",
      label: t("plan.export.speedupMinutes"),
      units: Math.min(calculation.speedupMinutesNeeded, heldMinutes),
      detail: t("plan.export.stockDetail", {
        needed: formatNumber(calculation.speedupMinutesNeeded),
        held: formatNumber(heldMinutes),
      }),
      matches: actionMatcher(/^Use 1m (of )?Speedups for Construction/),
    },
    {
      id: "power",
      label: t("plan.export.power"),
      units: calculation.power,
      matches: actionMatcher(/^Raise 1 Power through Construction$/),
    },
  ];
  const unscored: UnscoredLine[] = calculation.resources
    .filter((resource) => !SCORED_RESOURCE_IDS.includes(resource.itemId))
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
    page: "buildings",
    groups: [{ id: "buildings", lines, unscored }],
    upgrades: upgradesOf(calculation),
  };
};
