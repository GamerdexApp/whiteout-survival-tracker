import type { Playthrough } from "@/types/app";
import { buildViews, summarize as summarizeBuildings } from "./buildings";
import { charmItems, gearItems, powerNow } from "./chiefGear";
import { buildExpertViews, summarizeExperts } from "./experts";
import { buildHeroViews, summarizeHeroes } from "./heroes";
import { gearSetsOf, setPower } from "./heroGear";
import {
  buildingsPossiblePower,
  chiefCharmsPossiblePower,
  chiefGearPossiblePower,
  expertsPossiblePower,
  heroesPossiblePower,
  petsPossiblePower,
  researchPossiblePower,
} from "./overviewPowerMax";
import { buildPetViews, summarizePets } from "./pets";
import { buildAllNodeViews, summarizeResearch } from "./research";
import { buildTroopViews } from "./troops";

export type PowerGroupId =
  | "buildings"
  | "research"
  | "heroes"
  | "heroGear"
  | "chiefGear"
  | "chiefCharms"
  | "experts"
  | "pets"
  | "troops";

export interface PowerRow {
  id: PowerGroupId;
  href: string;
  power: number;
  /**
   * The most the group can give with everything at its top level inside the content the unlock
   * settings open. Null when the group has no maximum, because it depends on what you enter.
   */
  possible: number | null;
  /** Items of the group that have no power value in the package. They add nothing. */
  withoutValue: number;
}

export interface PowerSummary {
  rows: PowerRow[];
  total: number;
  /** Possible power of the whole: each group's maximum, or its current power when it has none. */
  totalPossible: number;
  withoutValue: number;
}

/**
 * The power of every group, read from the page that owns it, and their sum. A group lists the
 * items that have no power value, so the total is never presented as complete when it is not.
 */
export const summarizePower = (chief: Playthrough): PowerSummary => {
  const heroes = summarizeHeroes(buildHeroViews(chief), chief);
  const pets = summarizePets(buildPetViews(chief));
  const rows: PowerRow[] = [
    {
      id: "buildings",
      href: "/buildings",
      power: summarizeBuildings(buildViews(chief)).power,
      possible: buildingsPossiblePower(chief),
      withoutValue: 0,
    },
    {
      id: "research",
      href: "/research",
      power: summarizeResearch(buildAllNodeViews(chief)).power,
      possible: researchPossiblePower(chief),
      withoutValue: 0,
    },
    {
      id: "heroes",
      href: "/heroes",
      power: heroes.power,
      possible: heroesPossiblePower(chief),
      withoutValue: heroes.unknownPower,
    },
    {
      id: "heroGear",
      href: "/heroes",
      power: gearSetsOf(chief).reduce((sum, set) => sum + setPower(set), 0),
      possible: null,
      withoutValue: 0,
    },
    {
      id: "chiefGear",
      href: "/chief-gear",
      power: powerNow(gearItems(chief)),
      possible: chiefGearPossiblePower(chief),
      withoutValue: 0,
    },
    {
      id: "chiefCharms",
      href: "/chief-gear",
      power: powerNow(charmItems(chief)),
      possible: chiefCharmsPossiblePower(chief),
      withoutValue: 0,
    },
    {
      id: "experts",
      href: "/experts",
      power: summarizeExperts(buildExpertViews(chief)).powerNow,
      possible: expertsPossiblePower(chief),
      withoutValue: 0,
    },
    {
      id: "pets",
      href: "/pets",
      power: pets.power,
      possible: petsPossiblePower(chief),
      withoutValue: pets.unknownPower,
    },
    {
      id: "troops",
      href: "/troops",
      power: buildTroopViews(chief).reduce((sum, view) => sum + view.power, 0),
      possible: null,
      withoutValue: 0,
    },
  ];
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.power, 0),
    totalPossible: rows.reduce(
      (sum, row) => sum + (row.possible ?? row.power),
      0,
    ),
    withoutValue: rows.reduce((sum, row) => sum + row.withoutValue, 0),
  };
};
