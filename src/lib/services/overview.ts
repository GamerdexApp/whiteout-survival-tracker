import type { Playthrough } from "@/types/app";
import { techNodes } from "@/data/game/alliance";
import { furnace } from "@/data/game/buildings";
import {
  isExpertId,
  isHeroId,
  isPetId,
  isSkinId,
  packageTotals,
  vipLevelAtXp,
} from "@/data/game/overviewTotals";
import { allResearch } from "@/data/game/research";
import { buildTechViews, countTech } from "./allianceTech";
import { buildView, buildViews, maxOrder } from "./buildings";
import { charmItems, gearItems } from "./chiefGear";
import {
  furnaceLevelsMissing,
  islandUnlocked,
  unlockFurnaceLabel,
} from "./daybreak";
import { levelOfNode } from "./research";

export type AreaId =
  | "buildings"
  | "heroes"
  | "chiefGear"
  | "chiefCharms"
  | "experts"
  | "pets"
  | "research"
  | "allianceTech"
  | "skins";

export interface AreaProgress {
  id: AreaId;
  owned: number;
  total: number;
  href: string;
}

const countSaved = <State>(
  saved: Record<string, State> | undefined,
  isKnownId: (id: string) => boolean,
  isCounted: (state: State) => boolean,
) =>
  Object.entries(saved ?? {}).filter(
    ([id, state]) => isKnownId(id) && isCounted(state),
  ).length;

export const ownedSkinCountOf = (chief: Playthrough) =>
  countSaved(chief.skins, isSkinId, (state) => state.owned === true);

export const areaProgressOf = (chief: Playthrough): AreaProgress[] => [
  {
    id: "buildings",
    owned: buildViews(chief).filter((view) => view.built).length,
    total: packageTotals.buildings,
    href: "/buildings",
  },
  {
    id: "heroes",
    owned: countSaved(chief.heroes, isHeroId, (state) => state.owned === true),
    total: packageTotals.heroes,
    href: "/heroes",
  },
  {
    id: "chiefGear",
    owned: gearItems(chief).filter((item) => item.current !== null).length,
    total: packageTotals.chiefGearSlots,
    href: "/chief-gear",
  },
  {
    id: "chiefCharms",
    owned: charmItems(chief).filter((item) => item.current !== null).length,
    total: charmItems(chief).length,
    href: "/chief-gear",
  },
  {
    id: "experts",
    owned: countSaved(
      chief.experts,
      isExpertId,
      (state) => state.recruited === true,
    ),
    total: packageTotals.experts,
    href: "/experts",
  },
  {
    id: "pets",
    owned: countSaved(chief.pets, isPetId, (state) => state.unlocked === true),
    total: packageTotals.pets,
    href: "/pets",
  },
  {
    id: "research",
    owned: allResearch.filter((node) => levelOfNode(chief, node) >= 1).length,
    total: packageTotals.research,
    href: "/research",
  },
  {
    id: "allianceTech",
    owned: ownedTechCount(chief),
    total: techNodes.length,
    href: "/tech",
  },
  {
    id: "skins",
    owned: ownedSkinCountOf(chief),
    total: packageTotals.skins,
    href: "/skins",
  },
];

const ownedTechCount = (chief: Playthrough) => {
  const counts = countTech(buildTechViews(chief));
  return counts.maxed + counts.inProgress;
};

export interface FurnaceProgress {
  level: string | null;
  order: number;
  maxOrder: number;
  maxLevel: string;
  ratio: number;
}

export const furnaceProgressOf = (chief: Playthrough): FurnaceProgress => {
  const view = buildView(furnace, chief);
  const max = maxOrder(furnace);
  return {
    level: view.level,
    order: view.order,
    maxOrder: max,
    maxLevel: furnace.maxLevelLabel,
    ratio: view.order / max,
  };
};

export interface LockedArea {
  id: "daybreakIsland";
  href: string;
  furnaceLevel: string;
  levelsMissing: number;
}

export const lockedAreasOf = (chief: Playthrough): LockedArea[] =>
  islandUnlocked(chief)
    ? []
    : [
        {
          id: "daybreakIsland",
          href: "/daybreak-island",
          furnaceLevel: unlockFurnaceLabel,
          levelsMissing: furnaceLevelsMissing(chief),
        },
      ];

/** The VIP level of the saved XP, or undefined while the chief has not entered it. */
export const vipLevelOfChief = (chief: Playthrough) =>
  chief.vip?.totalXp === undefined
    ? undefined
    : vipLevelAtXp(chief.vip.totalXp);
