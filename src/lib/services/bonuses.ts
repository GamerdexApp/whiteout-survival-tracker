import { calculateBuffs } from "whiteout-survival-data";
import type {
  BuffCalculation,
  BuffProfile,
  BuffUnit,
} from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { entertainmentBuildings } from "@/data/game/buildings";
import { levelledBuildingLevels } from "./buildings";

const CONSTRUCTION_SPEED_STAT = "construction-speed";

/**
 * Reads the chief state that the other pages save and shapes it for `calculateBuffs`. A page adds
 * its section here when it is built.
 */
export const buffProfileOf = (chief: Playthrough): BuffProfile => ({
  buildingLevels: {
    ...levelledBuildingLevels(chief),
    ...Object.fromEntries(
      entertainmentBuildings
        .filter((building) => chief.buildings?.[building.id]?.built === true)
        .map((building) => [building.id, building.levels[0].label]),
    ),
  },
});

export const chiefBuffs = (chief: Playthrough): BuffCalculation =>
  calculateBuffs(buffProfileOf(chief));

/**
 * The construction speed percent that the Plan on Buildings starts from.
 */
export const constructionSpeedBonusPercent = (chief: Playthrough) =>
  chiefBuffs(chief).categories.find(
    (category) =>
      category.statKey === CONSTRUCTION_SPEED_STAT &&
      category.unit === "percent",
  )?.total ?? 0;

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatBuffValue = (total: number, unit: BuffUnit) => {
  const text = numberFormat.format(total);
  if (unit === "percent") return `${text}%`;
  if (unit === "hours") return `${text} h`;
  if (unit === "seconds") return `${text} s`;
  return text;
};
