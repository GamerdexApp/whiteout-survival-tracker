import { formatNumber, translator } from "@/i18n/formatter";
import type { TechCost, TechRequirement } from "@/service/allianceTech";
import { findItem } from "@/data/game/items";

export const costText = (cost: TechCost[]) =>
  cost
    .map((line) =>
      translator("tech")("node.costLine", {
        name: findItem(line.itemId)?.name ?? line.itemId,
        amount: formatNumber(line.amount),
      }),
    )
    .join(" · ");

export const unmetNeedsText = (requirements: TechRequirement[]) =>
  requirements
    .filter((requirement) => !requirement.met)
    .map((requirement) =>
      translator("tech")("node.needsPart", {
        name: requirement.nodeName,
        level: formatNumber(requirement.level),
      }),
    )
    .join(", ");
