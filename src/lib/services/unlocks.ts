import { formatCalendarDate, translator } from "@/i18n/formatter";
import type { Expert, Pet } from "whiteout-survival-data";
import type { Playthrough, UnlockArea } from "@/types/app";
import { findExpert, unreleasedExpertName } from "@/data/game/experts";
import { findPet } from "@/data/game/pets";
import { timelineMilestones, unlockDayOfKey } from "@/data/game/serverTimeline";
import { serverAgeDays } from "./serverAge";

export const UNLOCK_AREAS: UnlockArea[] = [
  "pets",
  "fireCrystal",
  "experts",
  "chiefGear",
  "chiefCharms",
  "warAcademy",
];

const MS_PER_DAY = 86_400_000;

export interface UnlockStep {
  /** The server day on which the content of the step unlocks. */
  day: number;
  /** What unlocks on that day. Names of pets, experts and Fire Crystal levels, or the unlock text. */
  names: string[];
  /** Everything of the area that is unlocked once this step is reached. */
  cumulative: number;
}

const keyedUnlocks = (prefix: string, exclude?: string) =>
  timelineMilestones.flatMap((milestone) =>
    milestone.unlocks
      .filter(
        (unlock) => unlock.key?.startsWith(prefix) && unlock.key !== exclude,
      )
      .map((unlock) => ({ day: milestone.day, name: unlock.name })),
  );

const withCumulative = (
  steps: { day: number; names: string[] }[],
): UnlockStep[] => {
  let running = 0;
  return steps.map((step) => {
    running += step.names.length;
    return { ...step, cumulative: running };
  });
};

const petName = (id: string) => findPet(id)?.name ?? id;
const expertName = (id: string) =>
  findExpert(id)?.name ?? unreleasedExpertName(id) ?? id;
const fcName = (id: string) => `FC ${id.replace("fc-", "")}`;

const stepsByArea: Record<UnlockArea, UnlockStep[]> = {
  pets: withCumulative(
    timelineMilestones
      .filter((milestone) => milestone.petIds.length > 0)
      .map((milestone) => ({
        day: milestone.day,
        names: milestone.petIds.map(petName),
      })),
  ),
  fireCrystal: withCumulative(
    timelineMilestones
      .filter((milestone) => milestone.fireCrystalLevelIds.length > 0)
      .map((milestone) => ({
        day: milestone.day,
        names: milestone.fireCrystalLevelIds.map(fcName),
      })),
  ),
  experts: withCumulative(
    timelineMilestones
      .filter((milestone) => milestone.expertIds.length > 0)
      .map((milestone) => ({
        day: milestone.day,
        names: milestone.expertIds.map(expertName),
      })),
  ),
  chiefGear: withCumulative(
    keyedUnlocks("chief-gear-", "chief-gear-converter").map((unlock) => ({
      day: unlock.day,
      names: [unlock.name],
    })),
  ),
  chiefCharms: withCumulative(
    keyedUnlocks("chief-charm-levels").map((unlock) => ({
      day: unlock.day,
      names: [unlock.name],
    })),
  ),
  warAcademy: withCumulative(
    ["war-academy", "t12-research"].flatMap((key) =>
      keyedUnlocks(key).map((unlock) => ({
        day: unlock.day,
        names: [unlock.name],
      })),
    ),
  ),
};

export const unlockStepsOf = (area: UnlockArea) => stepsByArea[area];

/** What the area has in all. Experts without an unlock day (Gareth) are not on the timeline. */
export const unlockTotalOf = (area: UnlockArea) =>
  stepsByArea[area][stepsByArea[area].length - 1].cumulative;

/**
 * The server day through which the area is unlocked, from the server age. It is 0 before the first
 * step, and null when the server age is not known.
 */
export const autoUnlockDay = (
  chief: Pick<Playthrough, "serverStartDate">,
  area: UnlockArea,
  now?: Date,
): number | null => {
  const age = serverAgeDays(chief, now);
  if (age === null) return null;
  return stepsByArea[area].reduce(
    (through, step) => (step.day <= age ? step.day : through),
    0,
  );
};

/** An override is a step day, or 0 for nothing unlocked. Any other saved value reads as no override. */
export const unlockOverrideOf = (
  chief: Playthrough,
  area: UnlockArea,
): number | null => {
  const saved = chief.unlockOverrides?.[area];
  if (saved === undefined) return null;
  return saved === 0 || stepsByArea[area].some((step) => step.day === saved)
    ? saved
    : null;
};

/** The override when the chief set one, else the server age. Null means nothing is locked. */
export const unlockedThroughDay = (
  chief: Playthrough,
  area: UnlockArea,
  now?: Date,
): number | null =>
  unlockOverrideOf(chief, area) ?? autoUnlockDay(chief, area, now);

export const isUnlockedOnDay = (
  chief: Playthrough,
  area: UnlockArea,
  requiredDay: number,
  now?: Date,
) => {
  const through = unlockedThroughDay(chief, area, now);
  return through === null || requiredDay <= through;
};

export const petUnlockDay = (pet: Pet) => pet.unlockRequirement.daysRequired;

export const expertUnlockDay = (expert: Expert) =>
  expert.unlockRequirement?.daysRequired ?? 0;

export const isPetUnlockedByAge = (chief: Playthrough, pet: Pet, now?: Date) =>
  isUnlockedOnDay(chief, "pets", petUnlockDay(pet), now);

export const isExpertUnlockedByAge = (
  chief: Playthrough,
  expert: Expert,
  now?: Date,
) => isUnlockedOnDay(chief, "experts", expertUnlockDay(expert), now);

const fcLevelDays = new Map(
  timelineMilestones.flatMap((milestone) =>
    milestone.fireCrystalLevelIds.map(
      (id) => [Number(id.replace("fc-", "")), milestone.day] as const,
    ),
  ),
);

/** The Fire Crystal level in a building level label such as `FC 5-2`. Null before the FC levels. */
export const fcLevelOfLabel = (label: string) => {
  const match = /^FC\s*(\d+)/i.exec(label.trim());
  return match ? Number(match[1]) : null;
};

export const fcUnlockDay = (fcLevel: number) => fcLevelDays.get(fcLevel) ?? 0;

export const isFcLevelUnlocked = (
  chief: Playthrough,
  fcLevel: number | null,
  now?: Date,
) =>
  fcLevel === null ||
  isUnlockedOnDay(chief, "fireCrystal", fcUnlockDay(fcLevel), now);

/**
 * The server day on which a building level label opens. A plain Fire Crystal level such as `FC 5`
 * opens with its own unlock. Its stages (`FC 5-1` to `FC 5-4`) open with the next Fire Crystal
 * level (FC 6), so the last unlocked level cannot be raised past its base level. Null for labels
 * that are not Fire Crystal levels.
 */
export const fcLabelUnlockDay = (label: string): number | null => {
  const match = /^FC\s*(\d+)(?:-(\d+))?$/i.exec(label.trim());
  if (!match) return null;
  const fcLevel = Number(match[1]);
  const isStage = match[2] !== undefined;
  return isStage && fcLevelDays.has(fcLevel + 1)
    ? fcUnlockDay(fcLevel + 1)
    : fcUnlockDay(fcLevel);
};

export const isBuildingLevelUnlocked = (
  chief: Playthrough,
  label: string,
  now?: Date,
) => {
  const day = fcLabelUnlockDay(label);
  return day === null || isUnlockedOnDay(chief, "fireCrystal", day, now);
};

const keyDay = (key: string) =>
  timelineMilestones.find((milestone) =>
    milestone.unlocks.some((unlock) => unlock.key === key),
  )?.day ?? 0;

const LEGENDARY_T4_TIERS = [
  "Legendary",
  "LegendaryT1",
  "LegendaryT2",
  "LegendaryT3",
  "LegendaryT4",
];
const LEGENDARY_T5_T6_TIERS = ["LegendaryT5", "LegendaryT6"];

/** The server day on which a Chief Gear level unlocks, by its tier. */
export const gearUnlockDay = (tier: string) =>
  LEGENDARY_T5_T6_TIERS.includes(tier)
    ? keyDay("chief-gear-legendary-t5-t6")
    : LEGENDARY_T4_TIERS.includes(tier)
      ? keyDay("chief-gear-legendary-t4")
      : (keyedUnlocks("chief-gear-mythic")[0]?.day ?? 0);

/** The server day on which a Chief Charm level unlocks. */
export const charmUnlockDay = (level: number) =>
  level >= 17
    ? keyDay("chief-charm-levels-17-18")
    : level >= 12
      ? keyDay("chief-charm-levels-12-16")
      : keyDay("chief-charm-levels-1-11");

export const isGearTierUnlocked = (
  chief: Playthrough,
  tier: string,
  now?: Date,
) => isUnlockedOnDay(chief, "chiefGear", gearUnlockDay(tier), now);

export const isCharmLevelUnlocked = (
  chief: Playthrough,
  level: number,
  now?: Date,
) => isUnlockedOnDay(chief, "chiefCharms", charmUnlockDay(level), now);

/** The calendar date, in UTC, on which a server day arrives for the chief. Null without a start date. */
export const unlockDateOf = (chief: Playthrough, day: number) =>
  chief.serverStartDate
    ? new Date(Date.parse(chief.serverStartDate) + day * MS_PER_DAY)
        .toISOString()
        .slice(0, 10)
    : null;

/** A calendar date from `unlockDateOf`, shown on the same day in any time zone. */
export const formatUnlockDate = (date: string) => formatCalendarDate(date);

/** The text that says why something is locked: the server day, with its date when it is known. */
export const unlockText = (chief: Playthrough, requiredDay: number) => {
  const t = translator("unlocks");
  const date = unlockDateOf(chief, requiredDay);
  return date === null
    ? t("lock.day", { day: String(requiredDay) })
    : t("lock.dayAndDate", {
        day: String(requiredDay),
        date: formatUnlockDate(date),
      });
};

export const WAR_ACADEMY_DAY = keyDay("war-academy");
export const T12_RESEARCH_DAY = keyDay("t12-research");

/**
 * War Academy and T12 research stay locked while the server age is not known and no override is
 * set, so a chief without a start date opens them by choosing a step.
 */
export const isWarAcademyOpenOnDay = (
  chief: Playthrough,
  requiredDay: number,
  now?: Date,
) => {
  const through = unlockedThroughDay(chief, "warAcademy", now);
  return through !== null && requiredDay <= through;
};
