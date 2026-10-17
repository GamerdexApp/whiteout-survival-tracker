import {
  calculateChiefCharm,
  charmLevelList,
  CHARMS_PER_GEAR_PIECE,
  gearPieceList,
} from "@/data/game/calcChiefCharm";
import type {
  ChiefCharmLevel,
  ChiefGearSlot,
  UpgradeRange,
  UpgradeResult,
} from "@/data/game/calcChiefCharm";

/** `from: null` is a charm with no level yet. `to: null` leaves the charm out. */
export interface CharmChoice {
  from: string | null;
  to: string | null;
}

export interface CharmRow {
  key: string;
  piece: ChiefGearSlot;
  number: number;
}

export type CharmChoices = Record<string, CharmChoice>;

export interface CharmBreakdownRow {
  row: CharmRow;
  from: ChiefCharmLevel | null;
  to: ChiefCharmLevel;
  result: UpgradeResult;
}

export const EMPTY_CHOICE: CharmChoice = { from: null, to: null };

export const charmRows: CharmRow[] = gearPieceList.flatMap((piece) =>
  Array.from({ length: CHARMS_PER_GEAR_PIECE }, (_, index) => ({
    key: `${piece.id}:${index}`,
    piece,
    number: index + 1,
  })),
);

const positionOf = (levelId: string | null) =>
  levelId === null
    ? -1
    : charmLevelList.findIndex((level) => level.id === levelId);

const levelById = (levelId: string) => charmLevelList[positionOf(levelId)];

/** The goal list starts at the start level, so a goal never sits below it. */
export const goalLevelsFrom = (from: string | null) =>
  charmLevelList.slice(Math.max(positionOf(from), 0));

/** A new start level above the goal lifts the goal to the start level. */
export const withStartLevel = (
  choice: CharmChoice,
  from: string | null,
): CharmChoice => {
  const goalIsBelowStart =
    choice.to !== null && positionOf(choice.to) < positionOf(from);
  return { from, to: goalIsBelowStart ? from : choice.to };
};

/** Every charm row has an entry, so a lookup by row key always finds one. */
export const choiceForAll = (choice: CharmChoice): CharmChoices =>
  Object.fromEntries(charmRows.map((row) => [row.key, choice]));

const rangeOf = (choice: CharmChoice): UpgradeRange | null =>
  choice.to === null ? null : { from: choice.from, to: choice.to };

export const planCharms = (choices: CharmChoices) => {
  const breakdown: CharmBreakdownRow[] = [];
  const ranges: UpgradeRange[] = [];
  for (const row of charmRows) {
    const range = rangeOf(choices[row.key]);
    if (range === null) continue;
    ranges.push(range);
    const result = calculateChiefCharm([range]);
    if (result.steps === 0) continue;
    breakdown.push({
      row,
      from: range.from === null ? null : levelById(range.from),
      to: levelById(range.to),
      result,
    });
  }
  return { total: calculateChiefCharm(ranges), breakdown };
};

/** The charm picture shows the goal level, then the start level, then level 1. */
export const levelNumberOf = (choice: CharmChoice) => {
  const shownLevelId = choice.to ?? choice.from;
  return shownLevelId === null ? 1 : levelById(shownLevelId).level;
};
