import type {
  AllianceTechCategory,
  AllianceTechLevel,
  AllianceTechNode,
} from "whiteout-survival-data";
import { findTechNode, techCategories, techNodes } from "@/data/game/alliance";

export type TechCategoryFilter = "all" | AllianceTechCategory;

export const categoryFilters: TechCategoryFilter[] = ["all", ...techCategories];

export const countOfCategory = (category: TechCategoryFilter) =>
  category === "all"
    ? techNodes.length
    : techNodes.filter((node) => node.category === category).length;

export const tiersOfTech = [
  ...new Set(techNodes.map((node) => node.tier)),
].sort((a, b) => a - b);

export const filterTechNodes = (
  category: TechCategoryFilter,
  tier: number | null,
  query: string,
) => {
  const text = query.trim().toLowerCase();

  return techNodes.filter(
    (node) =>
      (category === "all" || node.category === category) &&
      (tier === null || node.tier === tier) &&
      (!text ||
        node.name.toLowerCase().includes(text) ||
        node.description.toLowerCase().includes(text) ||
        (node.stat ?? "").toLowerCase().includes(text)),
  );
};

/** The package stores 0% for the placeholder node that has no stat, so a node without a stat has no bonus. */
export const bonusOfLevel = (
  node: AllianceTechNode,
  level: AllianceTechLevel,
) => (node.stat && level.bonus ? level.bonus : undefined);

/** A time of 0 seconds appears only on the placeholder node. */
export const timeOfLevel = (level: AllianceTechLevel) =>
  level.timeSeconds || undefined;

export interface TechRequirementView {
  name: string;
  level: number;
}

export const requirementsOfTechLevel = (
  level: AllianceTechLevel,
): TechRequirementView[] =>
  level.prerequisites.map((requirement) => ({
    name: findTechNode(requirement.id)?.name ?? requirement.id,
    level: requirement.level,
  }));
