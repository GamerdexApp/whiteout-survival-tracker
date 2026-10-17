import { eventBuff } from "whiteout-survival-data";
import type { BuffApplicability, EventBuff } from "whiteout-survival-data";

export type { BuffApplicability, EventBuff };

export const BUFF_SOURCE_IDS = [
  "cityBonusWarsBuffs",
  "deploymentCapacity",
  "petSkills",
  "daybreakIsland",
  "presidentSkills",
  "ministerBuff",
  "territoryBonuses",
  "facilityBuff",
  "marchAccelerator",
  "frostdragonTyrantTitles",
  "frostSphereDomainBonus",
] as const satisfies readonly (keyof EventBuff)[];

export type BuffSourceId = (typeof BUFF_SOURCE_IDS)[number];

export const allEventBuffs: EventBuff[] = eventBuff().get();
