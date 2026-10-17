import type {
  ChiefGearLevel,
  ChiefGearSlot,
  UpgradeRange,
  UpgradeResult,
} from "@/data/game/calcChiefGear";
import {
  calculateChiefGear,
  chiefGearImage,
  chiefGearLevelList,
  chiefGearPieceList,
} from "@/data/game/calcChiefGear";

/** A goal of null skips the piece. A current level of null means the piece is not crafted. */
export interface PieceRange {
  current: string | null;
  goal: string | null;
}

export type PieceRangeMap = Record<string, PieceRange>;

export interface PieceResult {
  piece: ChiefGearSlot;
  current: ChiefGearLevel | null;
  goal: ChiefGearLevel;
  result: UpgradeResult;
}

export const EMPTY_RANGE: PieceRange = { current: null, goal: null };

export const emptyRangeMap = (): PieceRangeMap =>
  Object.fromEntries(
    chiefGearPieceList.map((piece) => [piece.id, EMPTY_RANGE]),
  );

const positionOf = (levelId: string | null) =>
  levelId === null
    ? -1
    : chiefGearLevelList.findIndex((level) => level.id === levelId);

const levelOf = (levelId: string) => chiefGearLevelList[positionOf(levelId)];

export const goalLevelsFrom = (current: string | null) =>
  chiefGearLevelList.slice(Math.max(0, positionOf(current)));

/** Moving the current level above the goal lifts the goal to the current level. */
export const withCurrent = (
  range: PieceRange,
  current: string | null,
): PieceRange => {
  const goalBelowCurrent =
    range.goal !== null && positionOf(range.goal) < positionOf(current);
  return { current, goal: goalBelowCurrent ? current : range.goal };
};

export const hasStage = (level: ChiefGearLevel) => /-stage-\d+$/.test(level.id);

const pieceResultOf = (
  piece: ChiefGearSlot,
  range: UpgradeRange,
): PieceResult => ({
  piece,
  current: range.from === null ? null : levelOf(range.from),
  goal: levelOf(range.to),
  result: calculateChiefGear([range]),
});

export const runChiefGearPlan = (ranges: PieceRangeMap) => {
  const plannedRanges = chiefGearPieceList.flatMap((piece) => {
    const { current, goal } = ranges[piece.id];
    return goal === null ? [] : [{ piece, range: { from: current, to: goal } }];
  });

  return {
    total: calculateChiefGear(plannedRanges.map(({ range }) => range)),
    byPiece: plannedRanges.map(({ piece, range }) =>
      pieceResultOf(piece, range),
    ),
  };
};

export const pieceImageOf = (piece: ChiefGearSlot, range: PieceRange) => {
  const shownLevel = range.goal ?? range.current;
  return shownLevel === null
    ? undefined
    : chiefGearImage(piece, levelOf(shownLevel));
};
