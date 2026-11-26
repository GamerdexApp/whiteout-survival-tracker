import { formatNumber, translator } from "@/i18n/formatter";
import type {
  BuildingCalculation,
  ResearchCalculation,
} from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { findItem, RESOURCE_ITEM_IDS } from "@/data/game/items";
import { researchSpeedBonusPercent } from "./bonuses";
import { initialPlanRows, runPlan } from "./buildingPlan";
import { BASE_RESOURCE_IDS } from "./coreResources";
import type { BaseResourceId } from "./coreResources";
import {
  constructionSpeedupMinutes,
  ownedCount,
  researchSpeedupMinutes,
} from "./inventory";
import {
  defaultResearchControls,
  initialResearchRows,
  runResearchPlan,
} from "./researchPlan";
import { resourceStocks } from "./resourceTotals";
import type { ResourceStock } from "./resourceTotals";

export interface StockCheck {
  id: string;
  name: string;
  available: number;
  needed: number;
  unit?: string;
  /** A line under the row, such as the part of the stock that comes from a chest. */
  detail?: string;
}

export const stockShortBy = (check: StockCheck) =>
  Math.max(0, check.needed - check.available);

const isBaseResource = (itemId: string): itemId is BaseResourceId =>
  (BASE_RESOURCE_IDS as readonly string[]).includes(itemId);

const stockDetailOf = (stock: ResourceStock) => {
  const t = translator("resources");
  const parts = [
    ...(stock.packs > 0
      ? [t("planStock.fromPacks", { amount: formatNumber(stock.packs) })]
      : []),
    ...(stock.fromChests > 0
      ? [t("planStock.fromChests", { amount: formatNumber(stock.fromChests) })]
      : []),
  ];
  if (parts.length === 0) return undefined;
  const joined =
    parts.length === 1
      ? parts[0]
      : t("list.andLast", { rest: parts[0], last: parts[1] });
  return t("planStock.includes", { parts: joined });
};

/**
 * The stock of each item a plan takes. The base resources count the packs and, for what is still
 * short, the Custom Resource chests. Every other item counts as held.
 */
export const itemChecks = (
  needs: { itemId: string; amount: number }[],
  chief: Playthrough,
): StockCheck[] => {
  const stocks = resourceStocks(
    chief,
    Object.fromEntries(
      needs
        .filter((need) => isBaseResource(need.itemId))
        .map((need) => [need.itemId, need.amount]),
    ),
  );
  const inDisplayOrder = [
    ...BASE_RESOURCE_IDS.flatMap((id) =>
      needs.filter((need) => need.itemId === id),
    ),
    ...needs.filter((need) => !isBaseResource(need.itemId)),
  ];
  return inDisplayOrder.map(({ itemId, amount }) => {
    const base = {
      id: itemId,
      name: findItem(itemId)?.name ?? itemId,
      needed: amount,
    };
    if (!isBaseResource(itemId)) {
      return { ...base, available: ownedCount(chief, itemId) };
    }
    return {
      ...base,
      available: stocks[itemId].available,
      detail: stockDetailOf(stocks[itemId]),
    };
  });
};

/**
 * What a plan takes, set against what the chief holds. The time row compares the speedup minutes
 * the plan needs with the construction and general speedups on hand.
 */
export const resourceChecks = (
  calculation: BuildingCalculation,
  chief: Playthrough,
): StockCheck[] => {
  const t = translator("resources");
  return [
    ...itemChecks(
      RESOURCE_ITEM_IDS.map((id) => ({
        itemId: id,
        amount:
          calculation.resources.find((resource) => resource.itemId === id)
            ?.amount ?? 0,
      })),
      chief,
    ),
    {
      id: "construction-time",
      name: t("planStock.constructionTime"),
      available: constructionSpeedupMinutes(chief),
      needed: calculation.speedupMinutesNeeded,
      unit: t("planStock.minutesUnit"),
    },
  ];
};

/**
 * The same check for a research plan. It lists the items the plan takes, in the order the
 * calculator gives them, and compares the research time with the research and general speedups.
 */
export const researchChecks = (
  calculation: ResearchCalculation,
  chief: Playthrough,
): StockCheck[] => {
  const t = translator("resources");
  return [
    ...itemChecks(
      calculation.resources.map((resource) => ({
        itemId: resource.itemId,
        amount: resource.amount,
      })),
      chief,
    ),
    {
      id: "research-time",
      name: t("planStock.researchTime"),
      available: researchSpeedupMinutes(chief),
      needed: calculation.speedupMinutesNeeded,
      unit: t("planStock.minutesUnit"),
    },
  ];
};

const shortNamesOf = (checks: StockCheck[]) =>
  checks
    .filter((check) => check.unit === undefined && stockShortBy(check) > 0)
    .map((check) => check.name);

/**
 * The resources that the goals on the Buildings and Research pages need more of than the chief
 * holds. It is a note for the Resources page, not a calculator.
 */
export const plannerShortages = (chief: Playthrough): string[] => {
  const names = new Set<string>();

  const buildingRows = initialPlanRows(chief);
  if (buildingRows.length > 0) {
    try {
      shortNamesOf(
        resourceChecks(runPlan(buildingRows, chief, 0), chief),
      ).forEach((name) => names.add(name));
    } catch {
      // A goal the calculator rejects adds nothing to the note.
    }
  }

  const researchRows = initialResearchRows(chief);
  if (researchRows.length > 0) {
    try {
      const calculation = runResearchPlan(
        researchRows,
        chief,
        defaultResearchControls(chief),
        researchSpeedBonusPercent(chief),
      );
      shortNamesOf(researchChecks(calculation, chief)).forEach((name) =>
        names.add(name),
      );
    } catch {
      // A goal the calculator rejects adds nothing to the note.
    }
  }

  return [...names];
};
