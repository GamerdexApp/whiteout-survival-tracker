import { translator } from "@/i18n/formatter";
import { calculateExperts } from "whiteout-survival-data";
import type {
  BuffProfile,
  Expert,
  ExpertCalculation,
  ExpertGoal,
  ExpertSkill,
} from "whiteout-survival-data";
import type { ExpertGoalState, ExpertState, Playthrough } from "@/types/app";
import {
  ADVANCEMENT_INTERVAL,
  affinityForSkillLevel,
  BOOK_ITEM_ID,
  COMMON_SIGIL_ITEM_ID,
  EXP_PER_LEARNING_MINUTE,
  expertSkillMaxLevel,
  MAX_AFFINITY,
  nextLevelCostOf,
  relationshipAt,
  relationshipNumberAt,
  sigilItemIdOf,
  skillMaxLevelAtAffinity,
  skillPowerAt,
  statBonusOf,
  totalSkillNeededForLevel,
  trackedExperts,
} from "@/data/game/experts";
import { findItem } from "@/data/game/items";
import {
  generalMinutesApplied,
  minutesOfSpeedup,
  ownedCount,
  withOwnedCount,
} from "./inventory";
import type { StockCheck } from "./planStock";
import { expertTotals } from "./resourceTotals";
import { expertUnlockDay, isExpertUnlockedByAge } from "./unlocks";

export const SKILL_COUNT = 4;

/** A skill at level 0 is not unlocked. The package starts its levels at 1, and level 1 costs nothing. */
const UNLOCKED_LEVEL = 1;

export interface ExpertView {
  expert: Expert;
  /** True when the chief recruited the expert and the server age allows it. Only these count. */
  recruited: boolean;
  /** True when the server age or an override keeps the expert locked. The saved data stays. */
  locked: boolean;
  /** The server day the expert needs while it is locked. */
  lockDay: number | null;
  affinity: number;
  affinityAvailable: number;
  advanced: boolean;
  skillLevels: number[];
  skillExp: number[];
  /** The EXP of the learning session that runs now. It lands on its skill when the session ends. */
  learningExp: number[];
  /** The sigil item of the expert on the Resources page. The count lives in the inventory. */
  sigilItemId: string | null;
  sigils: number;
  goal: ExpertGoalState | undefined;
}

export const isAdvancementLevel = (level: number) =>
  level % ADVANCEMENT_INTERVAL === 0;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wholeOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

const sigilCountOf = (chief: Playthrough, expertId: string) => {
  const itemId = sigilItemIdOf(expertId);
  return itemId ? ownedCount(chief, itemId) : 0;
};

const learningExpOf = (
  chief: Playthrough,
  expertId: string,
  skillIndex: number,
) => {
  const job = chief.queues?.learning?.[0];
  return job?.expertId === expertId && job.skillIndex === skillIndex
    ? job.exp
    : 0;
};

export const buildExpertViews = (chief: Playthrough): ExpertView[] =>
  trackedExperts.map((expert) => {
    const saved: ExpertState = chief.experts?.[expert.id] ?? {};
    const locked = !isExpertUnlockedByAge(chief, expert);
    const affinity = clamp(wholeOr(saved.affinity, 1), 1, MAX_AFFINITY);
    const advanced = saved.advanced === true;
    return {
      expert,
      recruited: !locked && saved.recruited === true,
      locked,
      lockDay: locked ? expertUnlockDay(expert) : null,
      affinity,
      affinityAvailable: Math.max(0, wholeOr(saved.affinityAvailable, 0)),
      advanced,
      skillLevels: reachedLevels(
        expert,
        relationshipAffinityOf(affinity, advanced),
        unlockedLevels(expert, relationshipAffinityOf(affinity, advanced)),
        expert.skills.map((skill, index) => {
          const cap = skillCapAt(skill, affinity, advanced);
          const unlocked = Math.min(UNLOCKED_LEVEL, cap);
          return clamp(wholeOr(saved.skills?.[index], unlocked), unlocked, cap);
        }),
      ),
      skillExp: expert.skills.map((_, index) =>
        Math.max(0, wholeOr(saved.skillExp?.[index], 0)),
      ),
      learningExp: expert.skills.map((_, index) =>
        learningExpOf(chief, expert.id, index),
      ),
      sigilItemId: sigilItemIdOf(expert.id),
      sigils: sigilCountOf(chief, expert.id),
      goal: locked ? undefined : chief.expertsPlan?.goals[expert.id],
    };
  });

export type ExpertChange =
  | { kind: "recruited"; expertId: string; recruited: boolean }
  | { kind: "affinity"; expertId: string; affinity: number }
  | { kind: "affinityAvailable"; expertId: string; points: number }
  | { kind: "advanced"; expertId: string; advanced: boolean }
  | { kind: "skill"; expertId: string; index: number; level: number }
  | { kind: "skillExp"; expertId: string; index: number; exp: number }
  | { kind: "sigils"; expertId: string; count: number };

const replaceAt = (list: number[], index: number, value: number) =>
  list.map((existing, position) => (position === index ? value : existing));

export const applyExpertChange = (
  chief: Playthrough,
  change: ExpertChange,
): Playthrough => {
  const view = buildExpertViews(chief).find(
    (candidate) => candidate.expert.id === change.expertId,
  );
  if (!view || view.locked) return chief;
  if (change.kind === "sigils") {
    return view.sigilItemId
      ? withOwnedCount(chief, view.sigilItemId, change.count)
      : chief;
  }
  const current: ExpertState = chief.experts?.[change.expertId] ?? {};
  let next: ExpertState;
  switch (change.kind) {
    case "recruited":
      next = { ...current, recruited: change.recruited };
      break;
    case "affinity": {
      const affinity = clamp(change.affinity, 1, MAX_AFFINITY);
      next = {
        ...current,
        affinity,
        affinityAvailable: Math.min(
          view.affinityAvailable,
          affinityToMax(view.expert, affinity),
        ),
      };
      break;
    }
    case "affinityAvailable":
      next = {
        ...current,
        affinityAvailable: clamp(
          change.points,
          0,
          affinityToMax(view.expert, view.affinity),
        ),
      };
      break;
    case "advanced":
      next = { ...current, advanced: change.advanced };
      break;
    case "skill": {
      const skill = view.expert.skills[change.index];
      const cap = skillCapOf(view, change.index);
      const level = clamp(change.level, skillFloorOf(view, change.index), cap);
      next = {
        ...current,
        skills: replaceAt(view.skillLevels, change.index, level),
        skillExp: replaceAt(
          view.skillExp,
          change.index,
          Math.min(view.skillExp[change.index], skillExpToMax(skill, level)),
        ),
      };
      break;
    }
    case "skillExp":
      next = {
        ...current,
        skillExp: replaceAt(
          view.skillExp,
          change.index,
          clamp(
            change.exp,
            0,
            skillExpToMax(
              view.expert.skills[change.index],
              view.skillLevels[change.index],
            ),
          ),
        ),
      };
      break;
  }
  return { ...chief, experts: { ...chief.experts, [change.expertId]: next } };
};

export const affinityRowOf = (expert: Expert, level: number) =>
  expert.affinityLevels[level - 1];

/** Points needed to go from `level` to the next level. Zero at the top. */
export const affinityNeededFor = (expert: Expert, level: number) =>
  level >= MAX_AFFINITY ? 0 : affinityRowOf(expert, level + 1).affinityRequired;

/** The points of every level above `from` up to and including `to`. */
export const affinityBetween = (expert: Expert, from: number, to: number) =>
  expert.affinityLevels
    .filter((row) => row.level > from && row.level <= to)
    .reduce((sum, row) => sum + row.affinityRequired, 0);

/**
 * The affinity points of every level from `level` up to the top. The player can hold more points
 * than the next level needs, so the held points are limited by this total.
 */
export const affinityToMax = (expert: Expert, level: number) =>
  expert.affinityLevels
    .filter((row) => row.level > level)
    .reduce((sum, row) => sum + row.affinityRequired, 0);

/** The skills of a plan that go from level 0 to the first level. The calculator starts at 1. */
const unlocksOf = (view: ExpertView, goal: ExpertGoalState) =>
  view.skillLevels.filter(
    (level, index) =>
      level === 0 && (goal.skills?.[index] ?? 0) >= UNLOCKED_LEVEL,
  ).length;

export const skillExpNeededFor = (skill: ExpertSkill, level: number) =>
  level >= skill.maxLevel ? 0 : nextLevelCostOf(skill, level);

/**
 * The EXP of the levels from `from` up to `to`. The player can hold more EXP than the next level
 * costs, so a plan spends it over every level it needs.
 */
export const skillExpBetween = (skill: ExpertSkill, from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from) }, (_, index) =>
    nextLevelCostOf(skill, from + index),
  ).reduce((sum, exp) => sum + exp, 0);

/** The most EXP a skill can still use: every level from the current one to the top. */
export const skillExpToMax = (skill: ExpertSkill, level: number) =>
  skillExpBetween(skill, level, skill.maxLevel);

export const statNamesOf = (expert: Expert) =>
  expert.baseBonuses.map((bonus) => bonus.stat);

/**
 * The level whose bonus counts. A level divisible by 10 pays the bonus of the level before until
 * the expert is advanced.
 */
export const bonusLevelFor = (level: number, advanced: boolean) =>
  isAdvancementLevel(level) && !advanced ? level - 1 : level;

export interface BonusNow {
  countedLevel: number;
  percent: number;
  atMax: number;
  waitingForAdvancement: boolean;
}

export const bonusNowOf = (view: ExpertView): BonusNow => {
  const countedLevel = bonusLevelFor(view.affinity, view.advanced);
  return {
    countedLevel,
    percent: statBonusOf(affinityRowOf(view.expert, countedLevel)),
    atMax: statBonusOf(affinityRowOf(view.expert, MAX_AFFINITY)),
    waitingForAdvancement: countedLevel !== view.affinity,
  };
};

export interface NextAdvancement {
  level: number;
  sigils: number;
}

/** The next advancement the expert has to pay for, or null when all are done. */
export const nextAdvancementOf = (view: ExpertView): NextAdvancement | null => {
  const startLevel =
    isAdvancementLevel(view.affinity) && view.advanced
      ? view.affinity + 1
      : view.affinity;
  const row = view.expert.affinityLevels.find(
    (candidate) =>
      candidate.level >= startLevel && candidate.advancementCost !== undefined,
  );
  return row ? { level: row.level, sigils: row.advancementCost! } : null;
};

/**
 * A relationship starts on a level divisible by 10, the same levels that need an advancement. It
 * counts only once the expert is advanced there, so it follows the level whose bonus counts.
 */
const relationshipAffinityOf = (affinity: number, advanced: boolean) =>
  bonusLevelFor(affinity, advanced);

/**
 * The highest level of a skill that the relationship allows. It is 0 while the skill is locked.
 * Where the data states no cap, it is the max level of the skill.
 */
const skillCapAt = (skill: ExpertSkill, affinity: number, advanced: boolean) =>
  skillMaxLevelAtAffinity(skill, relationshipAffinityOf(affinity, advanced));

const skillTotal = (levels: number[]) =>
  levels.reduce((sum, level) => sum + level, 0);

/**
 * The levels that the skills can reach from `start` toward `targets`. A skill moves one level at a
 * time, and only when the relationship allows the level and the total of the four skills, before
 * the upgrade, meets what the level needs. An upgrade never blocks another one, so the order does
 * not change the result.
 */
const reachedLevels = (
  expert: Expert,
  countedAffinity: number,
  start: number[],
  targets: number[],
) => {
  const reached = [...start];
  let moved = true;
  while (moved) {
    moved = false;
    expert.skills.forEach((skill, index) => {
      const next = reached[index] + 1;
      if (
        next > targets[index] ||
        next > skillMaxLevelAtAffinity(skill, countedAffinity) ||
        skillTotal(reached) < totalSkillNeededForLevel(skill, next)
      ) {
        return;
      }
      reached[index] = next;
      moved = true;
    });
  }
  return reached;
};

const unlockedLevels = (expert: Expert, countedAffinity: number) =>
  expert.skills.map((skill) =>
    Math.min(UNLOCKED_LEVEL, skillMaxLevelAtAffinity(skill, countedAffinity)),
  );

const withLevel = (levels: number[], index: number, level: number) =>
  replaceAt(levels, index, level);

/** The highest level a skill can take now, with the other skills where they are. */
export const skillCapOf = (view: ExpertView, index: number) => {
  const counted = relationshipAffinityOf(view.affinity, view.advanced);
  const top = skillMaxLevelAtAffinity(view.expert.skills[index], counted);
  return reachedLevels(
    view.expert,
    counted,
    view.skillLevels,
    withLevel(view.skillLevels, index, top),
  )[index];
};

/**
 * The lowest level a skill can take now. A level of another skill may need the total that this
 * skill gives, so the skill cannot go below what keeps those levels valid.
 */
export const skillFloorOf = (view: ExpertView, index: number) => {
  const counted = relationshipAffinityOf(view.affinity, view.advanced);
  const start = unlockedLevels(view.expert, counted);
  for (let level = start[index]; level < view.skillLevels[index]; level += 1) {
    const targets = withLevel(view.skillLevels, index, level);
    const reached = reachedLevels(view.expert, counted, start, targets);
    if (reached.every((value, position) => value === targets[position])) {
      return level;
    }
  }
  return view.skillLevels[index];
};

export type SkillGate =
  | {
      kind: "affinity";
      /** The level that the skill cannot reach yet. */
      level: number;
      /** The affinity level, advanced, that allows it. */
      affinity: number;
    }
  | {
      kind: "total";
      level: number;
      /** The total of the four skill levels that the level needs. */
      total: number;
      /** The total of the four skill levels now. */
      have: number;
    };

/**
 * What holds a skill back when it sits at the top of what it can take. It is null when the skill
 * is free to level or when the data states no affinity level that allows the next level.
 */
const skillGateAt = (
  skill: ExpertSkill,
  level: number,
  cap: number,
  affinityCap: number,
  countedAffinity: number,
  levels: number[],
): SkillGate | null => {
  if (level < cap || level >= skill.maxLevel) return null;
  if (affinityCap <= level) {
    const needed = affinityForSkillLevel(skill, countedAffinity, level + 1);
    return needed === null
      ? null
      : { kind: "affinity", level: level + 1, affinity: needed };
  }
  return {
    kind: "total",
    level: level + 1,
    total: totalSkillNeededForLevel(skill, level + 1),
    have: skillTotal(levels),
  };
};

export const skillGateOf = (view: ExpertView, index: number) => {
  const counted = relationshipAffinityOf(view.affinity, view.advanced);
  const skill = view.expert.skills[index];
  return skillGateAt(
    skill,
    view.skillLevels[index],
    skillCapOf(view, index),
    skillMaxLevelAtAffinity(skill, counted),
    counted,
    view.skillLevels,
  );
};

export const talentLevelOf = (view: ExpertView) =>
  relationshipNumberAt(relationshipAffinityOf(view.affinity, view.advanced));

export const talentEffectOf = (view: ExpertView) => {
  const level = talentLevelOf(view);
  return view.expert.talent.progressions
    ?.filter((progression) => progression.label !== "Power")
    .map(
      (progression) => `${progression.label} ${progression.values[level - 1]}`,
    )
    .join(", ");
};

export const relationshipNameOf = (view: ExpertView) =>
  relationshipAt(relationshipAffinityOf(view.affinity, view.advanced)).name;

export interface ExpertPower {
  now: number;
  max: number;
}

const powerOf = (
  expert: Expert,
  affinity: number,
  advanced: boolean,
  skillLevels: number[],
): number => {
  const row = affinityRowOf(expert, affinity);
  const affinityPower =
    isAdvancementLevel(affinity) && advanced
      ? (row.affinityPowerAfterAdvancement ?? row.affinityPower)
      : row.affinityPower;
  const skills = expert.skills.reduce(
    (sum, skill, index) => sum + skillPowerAt(skill, skillLevels[index]),
    0,
  );
  const talent = skillPowerAt(
    expert.talent,
    relationshipNumberAt(relationshipAffinityOf(affinity, advanced)),
  );
  return skills + talent + (row.levelPower ?? 0) + (affinityPower ?? 0);
};

export const expertPowerOf = (view: ExpertView): ExpertPower => ({
  now: powerOf(view.expert, view.affinity, view.advanced, view.skillLevels),
  max: powerOf(
    view.expert,
    MAX_AFFINITY,
    true,
    view.expert.skills.map((skill) => skill.maxLevel),
  ),
});

export interface ExpertsSummary {
  recruited: number;
  total: number;
  /** Experts that the server age keeps locked. */
  lockedByAge: number;
  powerNow: number;
  powerAtMax: number;
  highest: { name: string; affinity: number } | null;
}

export const summarizeExperts = (views: ExpertView[]): ExpertsSummary => {
  const recruited = views.filter((view) => view.recruited);
  const highest = recruited.reduce<ExpertView | null>(
    (best, view) => (!best || view.affinity > best.affinity ? view : best),
    null,
  );
  return {
    recruited: recruited.length,
    total: views.length,
    lockedByAge: views.filter((view) => view.locked).length,
    powerNow: recruited.reduce((sum, view) => sum + expertPowerOf(view).now, 0),
    powerAtMax: views.reduce((sum, view) => sum + expertPowerOf(view).max, 0),
    highest: highest
      ? { name: highest.expert.name, affinity: highest.affinity }
      : null,
  };
};

export type ShowFilter = "everything" | "recruited" | "notRecruited";
export type ExpertOrder = "generation" | "affinity" | "power" | "name";

export interface ExpertFilters {
  search: string;
  generation: number | "all";
  show: ShowFilter;
  order: ExpertOrder;
}

export const defaultExpertFilters = (): ExpertFilters => ({
  search: "",
  generation: "all",
  show: "everything",
  order: "generation",
});

export const countExpertFilters = (filters: ExpertFilters) => {
  const defaults = defaultExpertFilters();
  return [
    filters.generation !== defaults.generation,
    filters.show !== defaults.show,
    filters.order !== defaults.order,
  ].filter(Boolean).length;
};

const orderComparators: Record<
  ExpertOrder,
  (a: ExpertView, b: ExpertView) => number
> = {
  generation: (a, b) =>
    a.expert.generation - b.expert.generation ||
    trackedExperts.indexOf(a.expert) - trackedExperts.indexOf(b.expert),
  affinity: (a, b) => b.affinity - a.affinity,
  power: (a, b) => expertPowerOf(b).now - expertPowerOf(a).now,
  name: (a, b) => a.expert.name.localeCompare(b.expert.name),
};

export const filterExpertViews = (
  views: ExpertView[],
  filters: ExpertFilters,
): ExpertView[] => {
  const search = filters.search.trim().toLowerCase();
  return views
    .filter(
      (view) =>
        (filters.generation === "all" ||
          view.expert.generation === filters.generation) &&
        (filters.show === "everything" ||
          (filters.show === "recruited") === view.recruited) &&
        (search === "" || view.expert.name.toLowerCase().includes(search)),
    )
    .sort(orderComparators[filters.order]);
};

/** The base bonus inputs of the recruited experts for `calculateBuffs`. */
export const expertBuffInputs = (
  chief: Playthrough,
): Pick<BuffProfile, "experts" | "expertAffinity"> => {
  const recruited = buildExpertViews(chief).filter((view) => view.recruited);
  return {
    experts: recruited.map((view) => ({
      expertId: view.expert.id,
      skills: {
        ...Object.fromEntries(
          view.expert.skills.map((skill, index) => [
            skill.name,
            view.skillLevels[index],
          ]),
        ),
        [view.expert.talent.name]: talentLevelOf(view),
      },
    })),
    expertAffinity: Object.fromEntries(
      recruited.map((view) => [
        view.expert.id,
        { level: view.affinity, advanced: view.advanced },
      ]),
    ),
  };
};

/**
 * Goals on the page. A value at or below the current one is not a goal. An advancement goal
 * counts only on a level divisible by 10 that is not already advanced.
 */
export const affinityGoalOf = (view: ExpertView): number | null => {
  const goal = view.goal?.affinity;
  return goal !== undefined && goal > view.affinity ? goal : null;
};

export const skillGoalOf = (view: ExpertView, index: number): number | null => {
  const goal = view.goal?.skills?.[index];
  return goal !== undefined && goal > view.skillLevels[index] ? goal : null;
};

export const hasAnyGoal = (view: ExpertView) =>
  affinityGoalOf(view) !== null ||
  view.skillLevels.some((_, index) => skillGoalOf(view, index) !== null);

export type Goals = Record<string, ExpertGoalState>;

const currentAdvancedFor = (view: ExpertView) =>
  isAdvancementLevel(view.affinity) && view.advanced;

/** The affinity of a goal and whether the expert counts as advanced there. */
const goalRelationshipOf = (view: ExpertView, goal: ExpertGoalState) => {
  const affinity = Math.max(goal.affinity ?? view.affinity, view.affinity);
  const advanced =
    goal.advanced === true &&
    isAdvancementLevel(affinity) &&
    !(affinity === view.affinity && currentAdvancedFor(view));
  const counted = advanced || (affinity === view.affinity && view.advanced);
  return { affinity, advanced, counted };
};

/** The levels the goal asks for, never below the current ones. */
const goalLevelsOf = (view: ExpertView, goal: ExpertGoalState) =>
  view.skillLevels.map((level, index) =>
    Math.max(goal.skills?.[index] ?? level, level),
  );

/**
 * The highest level of a skill that the goal can reach, with the other skills at their goals. It
 * is never below the current level.
 */
export const skillGoalCapOf = (
  view: ExpertView,
  goal: ExpertGoalState,
  index: number,
) => {
  const { affinity, counted } = goalRelationshipOf(view, goal);
  const top = Math.max(
    view.skillLevels[index],
    skillCapAt(view.expert.skills[index], affinity, counted),
  );
  const countedAffinity = relationshipAffinityOf(affinity, counted);
  return reachedLevels(
    view.expert,
    countedAffinity,
    view.skillLevels,
    withLevel(goalLevelsOf(view, goal), index, top),
  )[index];
};

/**
 * The lowest goal a skill can take. The goal of another skill may need the total that this goal
 * gives, so the goal cannot go below what keeps those goals reachable.
 */
export const skillGoalFloorOf = (
  view: ExpertView,
  goal: ExpertGoalState,
  index: number,
) => {
  const { affinity, counted } = goalRelationshipOf(view, goal);
  const countedAffinity = relationshipAffinityOf(affinity, counted);
  const goals = goalLevelsOf(view, goal);
  const reachable = reachedLevels(
    view.expert,
    countedAffinity,
    view.skillLevels,
    goals,
  );
  for (let level = view.skillLevels[index]; level < goals[index]; level += 1) {
    const targets = withLevel(reachable, index, level);
    const reached = reachedLevels(
      view.expert,
      countedAffinity,
      view.skillLevels,
      targets,
    );
    if (reached.every((value, position) => value >= targets[position])) {
      return level;
    }
  }
  return goals[index];
};

/** What holds the goal level of a skill back at the goal relationship. */
export const skillGoalGateOf = (
  view: ExpertView,
  goal: ExpertGoalState,
  index: number,
) => {
  const { affinity, counted } = goalRelationshipOf(view, goal);
  const countedAffinity = relationshipAffinityOf(affinity, counted);
  const skill = view.expert.skills[index];
  const levels = goalLevelsOf(view, goal);
  return skillGateAt(
    skill,
    levels[index],
    skillGoalCapOf(view, goal, index),
    skillCapAt(skill, affinity, counted),
    countedAffinity,
    levels,
  );
};

/** A goal that stays valid when the chief levels up after the plan was saved. */
export const sanitizeGoal = (
  view: ExpertView,
  goal: ExpertGoalState,
): ExpertGoalState => {
  const { affinity, advanced, counted } = goalRelationshipOf(view, goal);
  const countedAffinity = relationshipAffinityOf(affinity, counted);
  return {
    affinity,
    advanced,
    skills: reachedLevels(
      view.expert,
      countedAffinity,
      view.skillLevels,
      goalLevelsOf(view, goal),
    ),
  };
};

export const startingGoalFor = (view: ExpertView): ExpertGoalState =>
  sanitizeGoal(view, {});

export const initialExpertGoals = (chief: Playthrough): Goals => {
  const goals: Goals = {};
  buildExpertViews(chief).forEach((view) => {
    const saved = chief.expertsPlan?.goals[view.expert.id];
    if (saved && view.recruited)
      goals[view.expert.id] = sanitizeGoal(view, saved);
  });
  return goals;
};

/** Stores only what is above the current value, so the plan holds goals and nothing else. */
const compactGoal = (
  view: ExpertView,
  goal: ExpertGoalState,
): ExpertGoalState => {
  const clean = sanitizeGoal(view, goal);
  const compact: ExpertGoalState = {};
  if (clean.affinity! > view.affinity || clean.advanced) {
    compact.affinity = clean.affinity;
    if (clean.advanced) compact.advanced = true;
  }
  if (clean.skills!.some((level, index) => level > view.skillLevels[index])) {
    compact.skills = clean.skills;
  }
  return compact;
};

export const withSavedExpertsPlan = (
  chief: Playthrough,
  goals: Goals,
  savedAt: string,
): Playthrough => {
  const views = buildExpertViews(chief);
  const stored: Goals = {};
  views.forEach((view) => {
    const goal = goals[view.expert.id];
    if (goal) stored[view.expert.id] = compactGoal(view, goal);
  });
  return { ...chief, expertsPlan: { goals: stored, savedAt } };
};

export interface ExpertPlanRow {
  view: ExpertView;
  goal: ExpertGoalState;
  sigils: number;
  sigilsFromOwn: number;
  sigilsFromCommon: number;
  books: number;
  exp: number;
  levels: number;
  advancements: number;
  affinity: number;
  /** The points saved on the expert card plus the share of the Resources gifts the plan gives it. */
  affinityHeld: number;
  expHeld: number;
}

export interface ExpertsPlan {
  rows: ExpertPlanRow[];
  total: ExpertCalculation;
  /** The affinity of the gifts on the Resources page, which any expert can use. */
  giftAffinity: number;
}

const calculatorGoalOf = (
  view: ExpertView,
  goal: ExpertGoalState,
): ExpertGoal => {
  const clean = sanitizeGoal(view, goal);
  const currentAdvanced = currentAdvancedFor(view);
  const result: ExpertGoal = { id: view.expert.id };
  const levelChanges =
    clean.affinity! > view.affinity ||
    (clean.advanced === true && !currentAdvanced);
  if (levelChanges) {
    result.level = {
      current: view.affinity,
      goal: clean.affinity!,
      currentAdvanced,
      goalAdvanced: clean.advanced,
    };
  }
  const skills = view.expert.skills.flatMap((skill, index) =>
    clean.skills![index] > view.skillLevels[index]
      ? [
          {
            name: skill.name,
            current: Math.max(UNLOCKED_LEVEL, view.skillLevels[index]),
            goal: clean.skills![index],
          },
        ]
      : [],
  );
  if (skills.length > 0) result.skills = skills;
  return result;
};

const heldSkillExp = (view: ExpertView, goal: ExpertGoalState) =>
  view.expert.skills.reduce((sum, skill, index) => {
    const goalLevel = goal.skills?.[index] ?? view.skillLevels[index];
    if (goalLevel <= view.skillLevels[index]) return sum;
    return (
      sum +
      Math.min(
        view.skillExp[index] + view.learningExp[index],
        skillExpBetween(skill, view.skillLevels[index], goalLevel),
      )
    );
  }, 0);

export const runExpertsPlan = (
  chief: Playthrough,
  goals: Goals,
): ExpertsPlan => {
  const views = buildExpertViews(chief).filter(
    (view) => view.recruited && goals[view.expert.id],
  );
  const total = calculateExperts(
    views.map((view) => calculatorGoalOf(view, goals[view.expert.id])),
  );
  let giftAffinityLeft = expertTotals(chief).affinity;
  const rows = views.map((view, index): ExpertPlanRow => {
    const item = total.items[index];
    const own = sigilItemIdOf(view.expert.id);
    const sigilsFromOwn = Math.min(
      item.sigils,
      own ? ownedCount(chief, own) : 0,
    );
    const heldOnCard = Math.min(view.affinityAvailable, item.affinity);
    const fromGifts = Math.min(item.affinity - heldOnCard, giftAffinityLeft);
    giftAffinityLeft -= fromGifts;
    return {
      view,
      goal: goals[view.expert.id],
      sigils: item.sigils,
      sigilsFromOwn,
      sigilsFromCommon: item.sigils - sigilsFromOwn,
      books: item.books,
      exp: item.exp,
      levels: item.levels,
      advancements: item.advancements,
      affinity: item.affinity,
      affinityHeld: heldOnCard + fromGifts,
      expHeld: Math.min(heldSkillExp(view, goals[view.expert.id]), item.exp),
    };
  });
  const unlocks = views.reduce(
    (sum, view) => sum + unlocksOf(view, goals[view.expert.id]),
    0,
  );
  return {
    rows,
    total: { ...total, skillLevels: total.skillLevels + unlocks },
    giftAffinity: expertTotals(chief).affinity,
  };
};

const sumOf = (rows: ExpertPlanRow[], pick: (row: ExpertPlanRow) => number) =>
  rows.reduce((sum, row) => sum + pick(row), 0);

export const expStillToGet = (plan: ExpertsPlan) =>
  plan.total.exp - sumOf(plan.rows, (row) => row.expHeld);

export const learningMinutesNeeded = (plan: ExpertsPlan) =>
  Math.ceil(expStillToGet(plan) / EXP_PER_LEARNING_MINUTE);

export const learningSpeedupMinutes = (chief: Playthrough) =>
  minutesOfSpeedup(chief, "learning") + generalMinutesApplied(chief, "experts");

/** The learning speedup minutes the plan uses: what it needs, up to what the chief holds for it. */
export const learningMinutesUsed = (plan: ExpertsPlan, chief: Playthrough) =>
  Math.min(learningMinutesNeeded(plan), learningSpeedupMinutes(chief));

/**
 * Everything the chief holds for the plan, whatever the plan needs: the gifts once, and the points
 * saved on the card of each planned expert.
 */
export const affinityAvailable = (plan: ExpertsPlan) =>
  plan.giftAffinity + sumOf(plan.rows, (row) => row.view.affinityAvailable);

export const expertPlanChecks = (
  plan: ExpertsPlan,
  chief: Playthrough,
): StockCheck[] => {
  const t = translator("experts");
  return [
    {
      id: COMMON_SIGIL_ITEM_ID,
      name: findItem(COMMON_SIGIL_ITEM_ID)?.name ?? COMMON_SIGIL_ITEM_ID,
      available: ownedCount(chief, COMMON_SIGIL_ITEM_ID),
      needed: sumOf(plan.rows, (row) => row.sigilsFromCommon),
    },
    {
      id: BOOK_ITEM_ID,
      name: findItem(BOOK_ITEM_ID)?.name ?? BOOK_ITEM_ID,
      available: ownedCount(chief, BOOK_ITEM_ID),
      needed: plan.total.books,
    },
    {
      id: "affinity",
      name: t("plan.checks.affinity"),
      available: affinityAvailable(plan),
      needed: plan.total.affinity,
    },
    {
      id: "learning-time",
      name: t("plan.checks.learning"),
      available: learningSpeedupMinutes(chief),
      needed: learningMinutesNeeded(plan),
      unit: t("plan.checks.minutesUnit"),
    },
  ];
};
