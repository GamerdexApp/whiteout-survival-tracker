import { calculateBuffs } from "whiteout-survival-data";
import type {
  BuffCalculation,
  BuffProfile,
  BuffSourceGroup,
  BuffSourceStat,
  BuffUnit,
} from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { entertainmentBuildings } from "@/data/game/buildings";
import { allResearch } from "@/data/game/research";
import { levelledBuildingLevels } from "./buildings";
import { charmItems, gearItems } from "./chiefGear";
import { buildHeroViews } from "./heroes";
import { levelOfNode } from "./research";

const CONSTRUCTION_SPEED_STAT = "construction-speed";
const RESEARCH_SPEED_STAT = "research-speed";

/**
 * The saved level of every research node. A node the package does not know is left out, so an
 * edited save cannot make the calculator throw.
 */
const researchLevelsOf = (chief: Playthrough) =>
  Object.fromEntries(
    allResearch.flatMap((node) => {
      const level = levelOfNode(chief, node);
      return level > 0 ? [[node.id, level]] : [];
    }),
  );

/**
 * Reads the chief state that the other pages save and shapes it for `calculateBuffs`. A page adds
 * its section here when it is built.
 */
const heroSkillsOf = (chief: Playthrough) =>
  buildHeroViews(chief)
    .filter((view) => view.owned)
    .map((view) => ({ heroId: view.hero.id, skills: view.skillLevels }));

const chiefGearOf = (chief: Playthrough) =>
  Object.fromEntries(
    gearItems(chief).flatMap((item) =>
      item.current ? [[item.slotId, item.current]] : [],
    ),
  );

const chiefCharmsOf = (chief: Playthrough) => {
  const bySlot = new Map<string, string[]>();
  charmItems(chief).forEach((item) => {
    if (!item.current) return;
    bySlot.set(item.slotId, [...(bySlot.get(item.slotId) ?? []), item.current]);
  });
  return Object.fromEntries(bySlot);
};

export const buffProfileOf = (chief: Playthrough): BuffProfile => ({
  heroSkills: heroSkillsOf(chief),
  chiefGear: chiefGearOf(chief),
  chiefCharms: chiefCharmsOf(chief),
  researchLevels: researchLevelsOf(chief),
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
const speedPercentOf = (chief: Playthrough, statKey: string) =>
  chiefBuffs(chief).categories.find(
    (category) => category.statKey === statKey && category.unit === "percent",
  )?.total ?? 0;

export const constructionSpeedBonusPercent = (chief: Playthrough) =>
  speedPercentOf(chief, CONSTRUCTION_SPEED_STAT);

export const researchSpeedBonusPercent = (chief: Playthrough) =>
  speedPercentOf(chief, RESEARCH_SPEED_STAT);

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

const RESEARCH_SOURCE_IDS = ["research", "warAcademyResearch"];

/**
 * The package splits research into the Research Center queue and the War Academy queue. The page
 * shows one Research row that adds the two, so there are 19 kinds of source and not 20.
 */
export const mergeResearchSources = (
  sources: BuffSourceGroup[],
): BuffSourceGroup[] => {
  const research = sources.filter((source) =>
    RESEARCH_SOURCE_IDS.includes(source.id),
  );
  if (research.length < 2) return sources;

  const totals = new Map<string, BuffSourceStat>();
  research
    .flatMap((source) => source.stats)
    .forEach((stat) => {
      const key = `${stat.statKey}-${stat.unit}`;
      const known = totals.get(key);
      totals.set(key, {
        ...stat,
        total: Math.round(((known?.total ?? 0) + stat.total) * 10_000) / 10_000,
      });
    });

  const merged: BuffSourceGroup = {
    id: "research",
    name: "Research",
    stats: [...totals.values()],
  };
  const firstIndex = sources.findIndex((source) =>
    RESEARCH_SOURCE_IDS.includes(source.id),
  );
  return [
    ...sources
      .slice(0, firstIndex)
      .filter((source) => !RESEARCH_SOURCE_IDS.includes(source.id)),
    merged,
    ...sources
      .slice(firstIndex)
      .filter((source) => !RESEARCH_SOURCE_IDS.includes(source.id)),
  ];
};
