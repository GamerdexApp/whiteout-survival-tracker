import {
  allPets,
  calculatePets,
  findPet,
  PET_ADVANCEMENT_INTERVAL,
} from "@/data/game/calcPet";
import type {
  Pet,
  PetCalculation,
  PetGoal,
  PetItemResult,
} from "@/data/game/calcPet";

export interface PetCalculatorRow {
  petId: string;
  current: number;
  currentAdvanced: boolean;
  goal: number;
  goalAdvanced: boolean;
}

export const isAdvanceLevel = (level: number) =>
  level % PET_ADVANCEMENT_INTERVAL === 0;

export const petOfRow = (row: PetCalculatorRow) => findPet(row.petId) as Pet;

export const levelOptions = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * A pet that stays at its advanced current level keeps the advancement at the goal, so the goal
 * flag is locked on in that case.
 */
export const isGoalAdvancedLocked = (row: PetCalculatorRow) =>
  row.goal === row.current && row.currentAdvanced;

const normalizeRow = (row: PetCalculatorRow): PetCalculatorRow => {
  const currentAdvanced = row.currentAdvanced && isAdvanceLevel(row.current);
  const goal = Math.max(row.goal, row.current);
  const keepsCurrentAdvancement = goal === row.current && currentAdvanced;
  return {
    ...row,
    currentAdvanced,
    goal,
    goalAdvanced:
      keepsCurrentAdvancement || (row.goalAdvanced && isAdvanceLevel(goal)),
  };
};

export const newPetRow = (pet: Pet): PetCalculatorRow => ({
  petId: pet.id,
  current: 1,
  currentAdvanced: false,
  goal: pet.maxLevel,
  goalAdvanced: false,
});

export const withRowChanged = (
  rows: PetCalculatorRow[],
  petId: string,
  change: Partial<Omit<PetCalculatorRow, "petId">>,
) =>
  rows.map((row) =>
    row.petId === petId ? normalizeRow({ ...row, ...change }) : row,
  );

export const withEveryGoalAtMax = (
  rows: PetCalculatorRow[],
  advanceAtGoal: boolean,
) =>
  rows.map((row) =>
    normalizeRow({
      ...row,
      goal: petOfRow(row).maxLevel,
      goalAdvanced: advanceAtGoal,
    }),
  );

export const petsNotInRows = (rows: PetCalculatorRow[]) =>
  allPets.filter((pet) => !rows.some((row) => row.petId === pet.id));

const toPetGoal = (row: PetCalculatorRow): PetGoal => ({
  id: row.petId,
  current: row.current,
  goal: row.goal,
  currentAdvanced: row.currentAdvanced,
  goalAdvanced: row.goalAdvanced,
});

export const runPetCalculator = (rows: PetCalculatorRow[]): PetCalculation =>
  calculatePets(rows.map(toPetGoal));

/**
 * The package has no advanced power for some advancement levels, for example Cave Hyena at 20 and
 * 30, and then returns NaN.
 */
export const knownPower = (result: PetCalculation | PetItemResult) =>
  Number.isFinite(result.power) ? result.power : null;

export const hasProgress = (item: PetItemResult) =>
  item.levels > 0 || item.advancements > 0;
