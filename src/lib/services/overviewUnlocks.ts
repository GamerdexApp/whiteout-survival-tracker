import type { Playthrough, UnlockArea } from "@/types/app";
import { allHeroes } from "@/data/game/heroes";
import { timelineMilestones } from "@/data/game/serverTimeline";
import { buildExpertViews } from "./experts";
import { buildPetViews } from "./pets";
import { serverAgeDays } from "./serverAge";
import { unlockDateOf, unlockedThroughDay, unlockStepsOf } from "./unlocks";

export interface NextUnlock {
  day: number;
  names: string[];
  /** The calendar date in UTC. Null without a server start date. */
  date: string | null;
  /** Days from now to the unlock. Null when the server age is not known. */
  daysLeft: number | null;
  /** The server age is already past the day, so the setting is behind the server. */
  passed: boolean;
}

const nextUnlockOn = (
  chief: Playthrough,
  day: number,
  names: string[],
  age: number | null,
): NextUnlock => ({
  day,
  names,
  date: unlockDateOf(chief, day),
  daysLeft: age === null ? null : Math.max(0, day - age),
  passed: age !== null && day <= age,
});

export interface AreaUnlockRow {
  area: Extract<UnlockArea, "fireCrystal" | "pets" | "experts">;
  /** True while neither the server age nor an override is known. */
  unknown: boolean;
  unlocked: number;
  total: number;
  /** The name of the newest unlocked step, such as FC 3. Null when nothing is unlocked. */
  latest: string | null;
  /** The next step. Null when everything is unlocked. */
  next: NextUnlock | null;
}

const unlockedItemCount = (chief: Playthrough, area: AreaUnlockRow["area"]) => {
  if (area === "pets") {
    const views = buildPetViews(chief);
    return {
      unlocked: views.filter((view) => !view.locked).length,
      total: views.length,
    };
  }
  if (area === "experts") {
    const views = buildExpertViews(chief);
    return {
      unlocked: views.filter((view) => !view.locked).length,
      total: views.length,
    };
  }
  const steps = unlockStepsOf("fireCrystal");
  return { unlocked: 0, total: steps[steps.length - 1].cumulative };
};

/** What the server age (or the override) has unlocked in an area, and its next unlock. */
export const areaUnlockRow = (
  chief: Playthrough,
  area: AreaUnlockRow["area"],
  now: number,
): AreaUnlockRow => {
  const through = unlockedThroughDay(chief, area, new Date(now));
  const age = serverAgeDays(chief, new Date(now));
  const steps = unlockStepsOf(area);
  const counts = unlockedItemCount(chief, area);
  if (through === null) {
    return { area, unknown: true, ...counts, latest: null, next: null };
  }
  const reached = steps.filter((step) => step.day <= through);
  const upcoming = steps.find((step) => step.day > through);
  return {
    area,
    unknown: false,
    ...counts,
    latest:
      reached.length > 0
        ? (reached[reached.length - 1].names.at(-1) ?? null)
        : null,
    next: upcoming
      ? nextUnlockOn(chief, upcoming.day, upcoming.names, age)
      : null,
  };
};

const generationDays = new Map<number, number>();
for (const milestone of timelineMilestones) {
  for (const id of milestone.heroIds) {
    const generation = allHeroes.find((hero) => hero.id === id)?.generation;
    if (generation !== undefined && !generationDays.has(generation)) {
      generationDays.set(generation, milestone.day);
    }
  }
}

export interface NextGeneration {
  generation: number;
  next: NextUnlock;
}

/** The generation after the one the chief unlocked on the Edit chief form. Null at the last one. */
export const nextGenerationOf = (
  chief: Playthrough,
  now: number,
): NextGeneration | null => {
  const generation = chief.heroGenerationUnlocked + 1;
  const day = generationDays.get(generation);
  if (day === undefined) return null;
  return {
    generation,
    next: nextUnlockOn(chief, day, [], serverAgeDays(chief, new Date(now))),
  };
};
