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
  allExperts,
  BOOK_ITEM_ID,
  COMMON_SIGIL_ITEM_ID,
  EXP_PER_LEARNING_MINUTE,
  MAX_AFFINITY,
  nextLevelCostOf,
  relationshipAt,
  relationshipNumberAt,
  sigilItemIdOf,
  skillPowerAt,
} from "@/data/game/experts";
import { findItem } from "@/data/game/items";
import { ownedCount, speedupStock, withOwnedCount } from "./inventory";
import type { StockCheck } from "./planStock";
import { expertUnlockDay, isExpertUnlockedByAge } from "./unlocks";

export const SKILL_COUNT = 4;

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

export const buildExpertViews = (chief: Playthrough): ExpertView[] =>
  allExperts.map((expert) => {
    const saved: ExpertState = chief.experts?.[expert.id] ?? {};
    const locked = !isExpertUnlockedByAge(chief, expert);
    return {
      expert,
      recruited: !locked && saved.recruited === true,
      locked,
      lockDay: locked ? expertUnlockDay(expert) : null,
      affinity: clamp(wholeOr(saved.affinity, 1), 1, MAX_AFFINITY),
      affinityAvailable: Math.max(0, wholeOr(saved.affinityAvailable, 0)),
      advanced: saved.advanced === true,
      skillLevels: expert.skills.map((skill, index) =>
        clamp(wholeOr(saved.skills?.[index], 0), 0, skill.maxLevel),
      ),
      skillExp: expert.skills.map((_, index) =>
        Math.max(0, wholeOr(saved.skillExp?.[index], 0)),
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
      const level = clamp(change.level, 0, skill.maxLevel);
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

/**
 * The affinity points of every level from `level` up to the top. The player can hold more points
 * than the next level needs, so the held points are limited by this total.
 */
export const affinityToMax = (expert: Expert, level: number) =>
  expert.affinityLevels
    .filter((row) => row.level > level)
    .reduce((sum, row) => sum + row.affinityRequired, 0);

/** A skill at level 0 is not unlocked. The package starts its levels at 1, and level 1 costs nothing. */
const UNLOCKED_LEVEL = 1;

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
    percent: affinityRowOf(view.expert, countedLevel).statBonus,
    atMax: affinityRowOf(view.expert, MAX_AFFINITY).statBonus,
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
    allExperts.indexOf(a.expert) - allExperts.indexOf(b.expert),
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

/** A goal that stays valid when the chief levels up after the plan was saved. */
const sanitizeGoal = (
  view: ExpertView,
  goal: ExpertGoalState,
): ExpertGoalState => {
  const affinity = Math.max(goal.affinity ?? view.affinity, view.affinity);
  const advanced =
    goal.advanced === true &&
    isAdvancementLevel(affinity) &&
    !(affinity === view.affinity && currentAdvancedFor(view));
  return {
    affinity,
    advanced,
    skills: view.skillLevels.map((level, index) =>
      Math.max(goal.skills?.[index] ?? level, level),
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
  affinityHeld: number;
  expHeld: number;
}

export interface ExpertsPlan {
  rows: ExpertPlanRow[];
  total: ExpertCalculation;
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
        view.skillExp[index],
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
  const rows = views.map((view, index): ExpertPlanRow => {
    const item = total.items[index];
    const own = sigilItemIdOf(view.expert.id);
    const sigilsFromOwn = Math.min(
      item.sigils,
      own ? ownedCount(chief, own) : 0,
    );
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
      affinityHeld: Math.min(view.affinityAvailable, item.affinity),
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
  };
};

const sumOf = (rows: ExpertPlanRow[], pick: (row: ExpertPlanRow) => number) =>
  rows.reduce((sum, row) => sum + pick(row), 0);

export const expStillToGet = (plan: ExpertsPlan) =>
  plan.total.exp - sumOf(plan.rows, (row) => row.expHeld);

export const learningMinutesNeeded = (plan: ExpertsPlan) =>
  Math.ceil(expStillToGet(plan) / EXP_PER_LEARNING_MINUTE);

export const learningSpeedupMinutes = (chief: Playthrough) =>
  speedupStock(chief)
    .filter(({ type }) => type === "learning" || type === "general")
    .reduce((sum, stock) => sum + stock.minutes, 0);

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
      available: sumOf(plan.rows, (row) => row.affinityHeld),
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
