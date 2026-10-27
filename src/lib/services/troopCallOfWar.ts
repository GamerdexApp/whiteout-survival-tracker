import type { Playthrough, TroopId } from "@/types/app";
import { findExpert } from "@/data/game/experts";
import { buildExpertViews } from "./experts";
import { countOf, withTroopCount } from "./troops";
import { highestTierOf } from "./troops";
import { utcDayOf } from "./utcDay";

const EXPERT_ID = "romulus";
const SKILL_NAME = "Call of War";
export interface CallOfWar {
  troops: number;
  skillLevel: number;
}

/**
 * The free troops of the Romulus skill Call of War at its current level. It is null when Romulus
 * is not recruited or the skill is not unlocked.
 */
export const callOfWarOf = (chief: Playthrough): CallOfWar | null => {
  const view = buildExpertViews(chief).find(
    (item) => item.expert.id === EXPERT_ID,
  );
  if (!view?.recruited) return null;
  const index = view.expert.skills.findIndex(
    (skill) => skill.name === SKILL_NAME,
  );
  const skillLevel = view.skillLevels[index];
  if (index < 0 || skillLevel < 1) return null;
  const troops = findExpert(EXPERT_ID)?.skills[index].progressions?.find(
    (progression) => progression.label === "Troops",
  )?.values[skillLevel - 1];
  return troops === undefined ? null : { troops, skillLevel };
};

/** One claim is free for each UTC day, for all camps together. */
export const callOfWarClaimedToday = (chief: Playthrough, now: number) =>
  chief.troops?.callOfWarClaimedOn === utcDayOf(new Date(now));

/** The tier that a claim fills: the highest tier the camp has unlocked. Null when none. */
export const callOfWarTierOf = (chief: Playthrough, camp: TroopId) =>
  highestTierOf(chief, camp) || null;

export const withCallOfWarClaim = (
  chief: Playthrough,
  camp: TroopId,
  at: Date,
): Playthrough => {
  const callOfWar = callOfWarOf(chief);
  const tier = callOfWarTierOf(chief, camp);
  if (!callOfWar || !tier || callOfWarClaimedToday(chief, at.getTime()))
    return chief;
  const added = withTroopCount(
    chief,
    camp,
    tier,
    countOf(chief, camp, tier) + callOfWar.troops,
  );
  return {
    ...added,
    troops: { ...added.troops, callOfWarClaimedOn: utcDayOf(at) },
  };
};
