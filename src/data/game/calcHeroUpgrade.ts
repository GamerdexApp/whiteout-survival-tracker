import { calculateHeroUpgrade, events } from "whiteout-survival-data";
import type {
  ExclusiveWeaponSkill,
  GameEvent,
  Hero,
  HeroStatEstimate,
  HeroUpgradeCalculation,
  HeroUpgradeEventPoints,
  HeroUpgradeGoal,
} from "whiteout-survival-data";

export { calculateHeroUpgrade };
export type {
  ExclusiveWeaponSkill,
  Hero,
  HeroStatEstimate,
  HeroUpgradeCalculation,
  HeroUpgradeEventPoints,
  HeroUpgradeGoal,
};

const EVENT_ID_OF_SCORE: Record<keyof HeroUpgradeEventPoints, string> = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
  hallOfChief: "hall-of-chief",
};

export const heroUpgradeEvents = (
  Object.keys(EVENT_ID_OF_SCORE) as (keyof HeroUpgradeEventPoints)[]
).map((key) => ({
  key,
  name: (events().find(EVENT_ID_OF_SCORE[key]) as GameEvent).name,
}));
