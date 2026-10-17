import {
  beastLevelBands,
  calculateBeasts,
  ENDURANCE_TRAINING_LEVELS,
} from "@/data/game/calcBeast";
import type { BeastCalculation, BeastRun } from "@/data/game/calcBeast";

export const MAX_BEAST_COUNT = 99_999_999;

export interface BeastCalculatorInputs {
  stamina: number;
  staminaCans: number;
  /** The lowest level of the picked level band. */
  beastLevel: number;
  beastRuns: BeastRun[];
  polarTerrors: number;
  /** Undefined when Gina is not used. */
  ginaSkillLevel: number | undefined;
}

export const initialBeastInputs: BeastCalculatorInputs = {
  stamina: 0,
  staminaCans: 0,
  beastLevel: beastLevelBands[0].low,
  beastRuns: [],
  polarTerrors: 0,
  ginaSkillLevel: undefined,
};

export const ginaLevelOptions = Array.from(
  { length: ENDURANCE_TRAINING_LEVELS },
  (_, index) => index + 1,
);

export const runBeastCalculator = (
  inputs: BeastCalculatorInputs,
): BeastCalculation => calculateBeasts(inputs);

export const withRunChanged = (
  inputs: BeastCalculatorInputs,
  index: number,
  run: BeastRun,
): BeastCalculatorInputs => ({
  ...inputs,
  beastRuns: inputs.beastRuns.map((current, i) =>
    i === index ? run : current,
  ),
});

export const withRunAdded = (
  inputs: BeastCalculatorInputs,
): BeastCalculatorInputs => ({
  ...inputs,
  beastRuns: [...inputs.beastRuns, { level: inputs.beastLevel, count: 1 }],
});

export const withRunRemoved = (
  inputs: BeastCalculatorInputs,
  index: number,
): BeastCalculatorInputs => ({
  ...inputs,
  beastRuns: inputs.beastRuns.filter((_, i) => i !== index),
});

export type PlannedHuntRow =
  | { kind: "run"; id: string; level: number; count: number; points: number[] }
  | { kind: "polarTerrors"; id: string; count: number; points: number[] }
  | { kind: "total"; id: string; points: number[] };

/** One row for each planned hunt and a total row, with the points in each event of the result. */
export const plannedHuntRows = (
  inputs: BeastCalculatorInputs,
  result: BeastCalculation,
): PlannedHuntRow[] => {
  const runRows = inputs.beastRuns.map((run, index) => ({
    kind: "run" as const,
    id: `run-${index}`,
    level: run.level,
    count: run.count,
    points: result.events.map((event) => event.beastRuns[index].points),
  }));
  const polarTerrorRows =
    inputs.polarTerrors > 0
      ? [
          {
            kind: "polarTerrors" as const,
            id: "polarTerrors",
            count: inputs.polarTerrors,
            points: result.events.map(
              (event) => inputs.polarTerrors * event.pointsPerPolarTerror,
            ),
          },
        ]
      : [];
  const totalRow = {
    kind: "total" as const,
    id: "total",
    points: result.events.map((event) => event.plannedPoints),
  };
  return [...runRows, ...polarTerrorRows, totalRow];
};

export const hasPlannedHunts = (inputs: BeastCalculatorInputs) =>
  inputs.beastRuns.length > 0 || inputs.polarTerrors > 0;
