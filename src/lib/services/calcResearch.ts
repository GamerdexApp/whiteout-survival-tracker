import {
  calculateResearch,
  findResearch,
  isPlaceholder,
  maxLevelOf,
  SPEEDUP_EVENT_IDS,
} from "@/data/game/calcResearch";
import type {
  ResearchCalculation,
  ResearchNode,
  VicePresident,
} from "@/data/game/calcResearch";

export const MAX_SPEED_PERCENT = 10_000;

export interface LineLevels {
  current: number;
  goal: number;
}

export type LevelKey = keyof LineLevels;

export interface ResearchCalculatorInputs {
  /** Lines left out are at level 0 with no goal. */
  levels: Record<string, LineLevels>;
  speedPercent: number;
  stateBuff: boolean;
  vicePresident: VicePresident;
}

export const initialResearchInputs: ResearchCalculatorInputs = {
  levels: {},
  speedPercent: 0,
  stateBuff: false,
  vicePresident: "none",
};

const NOT_STARTED: LineLevels = { current: 0, goal: 0 };

export const levelsOf = (
  inputs: ResearchCalculatorInputs,
  nodeId: string,
): LineLevels => inputs.levels[nodeId] ?? NOT_STARTED;

const levelsWith = (
  levels: LineLevels,
  key: LevelKey,
  value: number,
): LineLevels =>
  key === "current"
    ? { current: value, goal: Math.max(levels.goal, value) }
    : { current: Math.min(levels.current, value), goal: value };

export const withLevel = (
  inputs: ResearchCalculatorInputs,
  nodeId: string,
  key: LevelKey,
  value: number,
): ResearchCalculatorInputs => ({
  ...inputs,
  levels: {
    ...inputs.levels,
    [nodeId]: levelsWith(levelsOf(inputs, nodeId), key, value),
  },
});

/** Lines with fewer levels than `value` go to their last level. */
export const withLevelForAll = (
  inputs: ResearchCalculatorInputs,
  nodes: ResearchNode[],
  key: LevelKey,
  value: number,
): ResearchCalculatorInputs => ({
  ...inputs,
  levels: {
    ...inputs.levels,
    ...Object.fromEntries(
      nodes.map((node) => [
        node.id,
        levelsWith(
          levelsOf(inputs, node.id),
          key,
          Math.min(value, maxLevelOf(node)),
        ),
      ]),
    ),
  },
});

export const levelOptions = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

export const plannedLineCount = (
  inputs: ResearchCalculatorInputs,
  nodes: ResearchNode[],
) =>
  nodes.filter((node) => {
    const levels = levelsOf(inputs, node.id);
    return levels.goal > levels.current;
  }).length;

/**
 * Every line with a level goes in, also when it has no goal above its level, because the package
 * checks prerequisites only against the lines it is given.
 */
export const runResearchCalculator = (
  inputs: ResearchCalculatorInputs,
): ResearchCalculation =>
  calculateResearch(
    Object.entries(inputs.levels)
      .filter(([, levels]) => levels.goal > 0)
      .map(([id, levels]) => ({ id, ...levels })),
    {
      researchSpeedPercent: inputs.speedPercent,
      stateBuff: inputs.stateBuff,
      ...(inputs.vicePresident === "none"
        ? {}
        : { vicePresident: inputs.vicePresident }),
    },
  );

export const plannedNodeOf = (id: string) => findResearch(id) as ResearchNode;

export const placeholderLinesOf = (calculation: ResearchCalculation) =>
  calculation.items
    .filter((item) => item.steps > 0 && isPlaceholder(plannedNodeOf(item.id)))
    .map((item) => item.name);

export interface StatGain {
  stat: string;
  amount: number;
  unit: "percent" | "flat";
}

/**
 * The bonus of each bought level added up by stat. A bonus without an amount, such as a troop
 * unlock, is listed by its text in `unlocks`.
 */
export const statGainsOf = (
  calculation: ResearchCalculation,
  inputs: ResearchCalculatorInputs,
) => {
  const gains = new Map<string, StatGain>();
  const unlocks: string[] = [];

  for (const item of calculation.items) {
    const node = plannedNodeOf(item.id);
    const { current, goal } = levelsOf(inputs, item.id);
    for (const level of node.levels.slice(current, goal)) {
      for (const bonus of level.bonus) {
        if (bonus.amount === undefined || bonus.unit === undefined) {
          unlocks.push(bonus.value);
          continue;
        }
        const key = `${bonus.stat}|${bonus.unit}`;
        const known = gains.get(key);
        gains.set(key, {
          stat: bonus.stat,
          unit: bonus.unit,
          amount: (known?.amount ?? 0) + bonus.amount,
        });
      }
    }
  }

  return { gains: [...gains.values()], unlocks };
};

export interface SpeedupEventRow {
  id: (typeof SPEEDUP_EVENT_IDS)[number];
  shardPoints: number;
  speedupPoints: number;
}

/** The speedup points assume every minute of the research time is finished with speedups. */
export const speedupEventRowsOf = (
  calculation: ResearchCalculation,
): SpeedupEventRow[] =>
  SPEEDUP_EVENT_IDS.map((id) => ({
    id,
    shardPoints: calculation.eventPoints[id],
    speedupPoints:
      calculation.speedupMinutesNeeded * calculation.speedupPointsPerMinute[id],
  }));
