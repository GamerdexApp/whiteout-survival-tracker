import { BEAST_CALCULATOR, calculateBeasts } from "whiteout-survival-data";
import type { BeastCalculation } from "whiteout-survival-data";
import { gameEventOf } from "./coreEvents";
import { findHero } from "./heroes";

export { BEAST_CALCULATOR, calculateBeasts };
export type { BeastCalculation };

/** The Resources item that counts the stamina cans of the chief. */
export const STAMINA_CAN_ITEM_ID = "chief-stamina";

export const GINA_ID = "gina";
export const ENDURANCE_TRAINING = "Endurance Training";

const enduranceTraining = findHero(GINA_ID)!.skills.expedition.find(
  (skill) => skill.name === ENDURANCE_TRAINING,
)!;

export const ENDURANCE_TRAINING_LEVELS = enduranceTraining.levels.length;

/** The percent of stamina that a level of Endurance Training takes off a hunt. */
export const staminaReductionOf = (level: number) =>
  enduranceTraining.levels[level - 1].effects.find(
    (effect) => effect.name === "Stamina Cost Reduction",
  )!.amount;

const LEVEL_RANGE = /Lv\.?\s*(\d+)\s*to\s*(\d+)\s*Beast/i;

export interface BeastLevelBand {
  low: number;
  high: number;
  points: number;
}

/**
 * The beast levels that score the same points in State of Power. The package lists "Lv. 20 to 25"
 * after "Lv. 16 to 20", so level 20 scores in the earlier row and this band starts at 21.
 */
export const beastLevelBands: BeastLevelBand[] = gameEventOf("svs")
  .days!.flatMap((day) => day.scoring)
  .flatMap((row) => {
    const range = LEVEL_RANGE.exec(row.action);
    return range
      ? [{ low: Number(range[1]), high: Number(range[2]), points: row.points }]
      : [];
  })
  .reduce<BeastLevelBand[]>((bands, band) => {
    const previous = bands[bands.length - 1];
    const low = previous ? Math.max(band.low, previous.high + 1) : band.low;
    return [...bands, { ...band, low }];
  }, []);

export const beastLevelBandOf = (level: number) =>
  beastLevelBands.find((band) => level >= band.low && level <= band.high)!;

/** Tells whether a scoring row of State of Power pays a beast of this level. */
export const rowPaysBeastLevel = (action: string, level: number) => {
  const range = LEVEL_RANGE.exec(action);
  return (
    range !== null && level >= Number(range[1]) && level <= Number(range[2])
  );
};

export const rowPaysPolarTerror = (action: string) =>
  /Polar Terror/i.test(action);
