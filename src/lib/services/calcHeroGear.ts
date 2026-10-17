import { DEFAULT_QUALITY, forgingRows } from "@/data/game/calcHeroGear";
import type {
  HeroGearPieceGoal,
  HeroGearQuality,
  HeroGearSlot,
  TroopType,
} from "@/data/game/calcHeroGear";

export interface LevelRange {
  current: number;
  goal: number;
}

export interface HeroGearInputs {
  quality: HeroGearQuality;
  slot: HeroGearSlot;
  troopType: TroopType;
  /** Indexes into `forgingRows`. -1 is a piece with no mastery forging. */
  forging: LevelRange;
  enhancement: LevelRange;
  empowerment: LevelRange;
}

export type RangeSide = keyof LevelRange;

export const NO_FORGING = -1;

const emptyRange = (bottom: number): LevelRange => ({
  current: bottom,
  goal: bottom,
});

export const defaultHeroGearInputs: HeroGearInputs = {
  quality: DEFAULT_QUALITY,
  slot: "goggles",
  troopType: "infantry",
  forging: emptyRange(NO_FORGING),
  enhancement: emptyRange(0),
  empowerment: emptyRange(0),
};

export const resetLevels = (inputs: HeroGearInputs): HeroGearInputs => ({
  ...inputs,
  forging: emptyRange(NO_FORGING),
  enhancement: emptyRange(0),
  empowerment: emptyRange(0),
});

/** Moves the other side with the changed one, so the goal never sits below the current level. */
export const withRangeSide = (
  range: LevelRange,
  side: RangeSide,
  value: number,
): LevelRange =>
  side === "current"
    ? { current: value, goal: Math.max(value, range.goal) }
    : { current: Math.min(value, range.current), goal: value };

export const isMythic = (quality: HeroGearQuality) => quality === "mythic";

/** Only Mythic gear is forged and empowered, so another quality clears both tracks. */
export const withQuality = (
  inputs: HeroGearInputs,
  quality: HeroGearQuality,
): HeroGearInputs =>
  isMythic(quality)
    ? { ...inputs, quality }
    : {
        ...inputs,
        quality,
        forging: emptyRange(NO_FORGING),
        empowerment: emptyRange(0),
      };

const forgingRowId = (index: number) =>
  index === NO_FORGING ? null : forgingRows[index].id;

export const heroGearGoalOf = (inputs: HeroGearInputs): HeroGearPieceGoal => ({
  quality: inputs.quality,
  piece: { slot: inputs.slot, troopType: inputs.troopType },
  enhancement: inputs.enhancement,
  empowerment: inputs.empowerment,
  ...(inputs.forging.goal !== NO_FORGING && {
    masteryForging: {
      current: forgingRowId(inputs.forging.current),
      goal: forgingRows[inputs.forging.goal].id,
    },
  }),
});
