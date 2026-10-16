import { skins, vip } from "whiteout-survival-data";
import { techNodes } from "./alliance";
import { allBuildings } from "./buildings";
import { chiefGearSlotList } from "./chiefGear";
import { allExperts } from "./experts";
import { allHeroes } from "./heroes";
import { allPets } from "./pets";
import { allResearch } from "./research";

export const SERVER_AGE_TOLERANCE_DAYS = 21;
export const NEXT_RUNS_SHOWN = 4;
export const OPEN_TASKS_SHOWN = 4;
export const WEEK_DAYS = 7;

export const packageTotals = {
  buildings: allBuildings.length,
  heroes: allHeroes.length,
  research: allResearch.length,
  experts: allExperts.length,
  pets: allPets.length,
  allianceTech: techNodes.length,
  skins: skins().get().length,
  chiefGearSlots: chiefGearSlotList.length,
};

const skinIds = new Set(
  skins()
    .get()
    .map((skin) => skin.id),
);
const heroIds = new Set(allHeroes.map((hero) => hero.id));
const expertIds = new Set(allExperts.map((expert) => expert.id));
const petIds = new Set(allPets.map((pet) => pet.id));

export const isSkinId = (id: string) => skinIds.has(id);
export const isHeroId = (id: string) => heroIds.has(id);
export const isExpertId = (id: string) => expertIds.has(id);
export const isPetId = (id: string) => petIds.has(id);

export const vipLevelAtXp = (totalXp: number) =>
  vip().atXp(totalXp).first()?.level;
