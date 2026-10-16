import { translator } from "@/i18n/formatter";
import { calculatePets } from "whiteout-survival-data";
import type {
  BuffPet,
  Pet,
  PetCalculation,
  PetGoal,
  PetItemResult,
  PetRarity,
  PetStatValue,
} from "whiteout-survival-data";
import type {
  PetGoalState,
  PetsPlanState,
  PetState,
  Playthrough,
} from "@/types/app";
import { formatDuration } from "@/lib/format";
import { furnace, FURNACE_ID } from "@/data/game/buildings";
import { findItem } from "@/data/game/items";
import {
  allPets,
  CONSTRUCTION_PET_ID,
  findPet,
  PET_ADVANCEMENT_INTERVAL,
  PET_REFINEMENT_STATS,
  PLAN_ITEM_IDS,
} from "@/data/game/pets";
import { levelOrder } from "./buildings";
import { ownedCount } from "./inventory";
import type { StockCheck } from "./planStock";
import { serverAgeDays } from "./research";

export const REFINE_STEP = 0.1;
const REFINE_DECIMALS = 2;
const REFINE_COUNT = PET_REFINEMENT_STATS.length;

const clampInt = (value: number, min: number, max: number) =>
  Math.min(
    max,
    Math.max(min, Math.floor(Number.isFinite(value) ? value : min)),
  );

const roundPercent = (value: number) => Number(value.toFixed(REFINE_DECIMALS));

export const clampRefine = (value: number, pet: Pet) =>
  roundPercent(
    Math.min(
      pet.maxRefinementPercent,
      Math.max(0, Number.isFinite(value) ? value : 0),
    ),
  );

export const isAdvanceLevel = (level: number) =>
  level % PET_ADVANCEMENT_INTERVAL === 0;

const knownPower = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) && value > 0 ? value : null;

export interface PetView {
  pet: Pet;
  unlocked: boolean;
  level: number;
  advanced: boolean;
  canAdvance: boolean;
  refine: number[];
  goal: PetGoalState | null;
  attack: number;
  defense: number;
  power: number | null;
}

const statAt = (stat: PetStatValue, advanced: boolean) =>
  advanced && stat.refinedValue !== undefined ? stat.refinedValue : stat.value;

export const buildPetView = (chief: Playthrough, pet: Pet): PetView => {
  const state = chief.pets?.[pet.id];
  const level = clampInt(state?.level ?? 1, 1, pet.maxLevel);
  const canAdvance = isAdvanceLevel(level);
  const advanced = canAdvance && state?.advanced === true;
  const row = pet.levels[level - 1];
  const savedGoal = chief.petsPlan?.goals?.[pet.id];

  return {
    pet,
    unlocked: state?.unlocked === true,
    level,
    advanced,
    canAdvance,
    refine: Array.from({ length: REFINE_COUNT }, (_, index) =>
      clampRefine(state?.refine?.[index] ?? 0, pet),
    ),
    goal: savedGoal ? normalizeGoal(savedGoal, pet) : null,
    attack: statAt(row.troopAttack, advanced),
    defense: statAt(row.troopDefense, advanced),
    power: knownPower(statAt(row.troopsPower, advanced)),
  };
};

export const buildPetViews = (chief: Playthrough) =>
  allPets.map((pet) => buildPetView(chief, pet));

const normalizeGoal = (goal: PetGoalState, pet: Pet): PetGoalState => {
  const level = clampInt(goal.level, 1, pet.maxLevel);
  return {
    level,
    advanceAtGoal: goal.advanceAtGoal === true && isAdvanceLevel(level),
  };
};

/**
 * A saved goal counts when it is above the current level, or when it pays for the advancement of
 * the current level that is not paid yet.
 */
export const activeGoalOf = (view: PetView): PetGoalState | null => {
  if (!view.goal) return null;
  const paysAdvancement =
    view.goal.level === view.level && view.goal.advanceAtGoal && !view.advanced;
  return view.goal.level > view.level || paysAdvancement ? view.goal : null;
};

export const hasPetGoal = (view: PetView) => activeGoalOf(view) !== null;

export const unlockedViews = (views: PetView[]) =>
  views.filter((view) => view.unlocked);

export const roundTotal = (value: number) => Number(value.toFixed(2));

export interface TroopTotals {
  attack: number;
  defense: number;
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
}

const sumOf = (views: PetView[], pick: (view: PetView) => number) =>
  roundTotal(views.reduce((total, view) => total + pick(view), 0));

export const troopTotals = (views: PetView[]): TroopTotals => {
  const active = unlockedViews(views);
  const refined = (index: number) =>
    sumOf(active, (view) => view.refine[index]);
  return {
    attack: sumOf(active, (view) => view.attack),
    defense: sumOf(active, (view) => view.defense),
    infantry: { lethality: refined(0), health: refined(1) },
    lancer: { lethality: refined(2), health: refined(3) },
    marksman: { lethality: refined(4), health: refined(5) },
  };
};

export const unlockRuleText = (pet: Pet) => {
  const t = translator("pets");
  const { daysRequired, furnaceLevel, prerequisitePet } = pet.unlockRequirement;
  const days = String(daysRequired);
  return prerequisitePet
    ? t("unlock.afterPet", {
        days,
        pet: prerequisitePet.name,
        level: String(prerequisitePet.level),
      })
    : t("unlock.afterFurnace", { days, level: String(furnaceLevel) });
};

const prerequisiteMet = (chief: Playthrough, pet: Pet) => {
  const prerequisite = pet.unlockRequirement.prerequisitePet;
  if (!prerequisite) return true;
  const held = buildPetView(chief, findPet(prerequisite.petId) as Pet);
  return held.unlocked && held.level >= prerequisite.level;
};

const furnaceMet = (chief: Playthrough, pet: Pet) => {
  const required = pet.unlockRequirement.furnaceLevel;
  if (required === undefined) return true;
  return (
    levelOrder(furnace, chief.buildings?.[FURNACE_ID]?.level) >=
    levelOrder(furnace, String(required))
  );
};

/**
 * True when the day, the Furnace and the previous pet all meet the rule. A chief with no server
 * start date has an unknown day count, so the rule is never reported as met.
 */
export const unlockRuleMet = (chief: Playthrough, pet: Pet, nowMs: number) => {
  const age = serverAgeDays(chief, new Date(nowMs));
  return (
    age !== null &&
    age >= pet.unlockRequirement.daysRequired &&
    furnaceMet(chief, pet) &&
    prerequisiteMet(chief, pet)
  );
};

export interface PetsSummary {
  unlocked: number;
  total: number;
  power: number;
  unknownPower: number;
  next: PetView | null;
}

export const summarizePets = (views: PetView[]): PetsSummary => {
  const active = unlockedViews(views);
  return {
    unlocked: active.length,
    total: views.length,
    power: active.reduce((total, view) => total + (view.power ?? 0), 0),
    unknownPower: active.filter((view) => view.power === null).length,
    next: views.find((view) => !view.unlocked) ?? null,
  };
};

export const skillTierOf = (pet: Pet, level: number) =>
  clampInt(
    Math.floor(level / PET_ADVANCEMENT_INTERVAL),
    1,
    pet.skill.values.length,
  );

export const skillCooldownText = (pet: Pet) => {
  const t = translator("pets");
  const { cooldownSeconds, cooldownSecondsByTier } = pet.skill;
  if (cooldownSeconds !== undefined) {
    return t("card.cooldown", { time: formatDuration(cooldownSeconds) });
  }
  return cooldownSecondsByTier
    ? t("card.cooldownByTier")
    : t("card.cooldownUnknown");
};

export type PetStatusFilter = "all" | "unlocked" | "locked";
export type PetAdvancedFilter = "any" | "advanced" | "notAdvanced";
export type PetOrder = "game" | "name" | "level";

export interface PetFilters {
  search: string;
  rarity: PetRarity | "all";
  status: PetStatusFilter;
  advanced: PetAdvancedFilter;
  order: PetOrder;
}

export const defaultPetFilters = (): PetFilters => ({
  search: "",
  rarity: "all",
  status: "all",
  advanced: "any",
  order: "game",
});

export const activePetFilters = (filters: PetFilters) =>
  [
    filters.rarity !== "all" ? "rarity" : null,
    filters.status !== "all" ? "status" : null,
    filters.advanced !== "any" ? "advanced" : null,
    filters.order !== "game" ? "order" : null,
  ].filter(
    (id): id is "rarity" | "status" | "advanced" | "order" => id !== null,
  );

export const countPetFilters = (filters: PetFilters) =>
  activePetFilters(filters).length;

const matchesFilters = (view: PetView, filters: PetFilters) => {
  const search = filters.search.trim().toLowerCase();
  return (
    (search === "" || view.pet.name.toLowerCase().includes(search)) &&
    (filters.rarity === "all" || view.pet.rarity === filters.rarity) &&
    (filters.status === "all" ||
      view.unlocked === (filters.status === "unlocked")) &&
    (filters.advanced === "any" ||
      view.advanced === (filters.advanced === "advanced"))
  );
};

export const filterPetViews = (views: PetView[], filters: PetFilters) => {
  const matching = views.filter((view) => matchesFilters(view, filters));
  if (filters.order === "name") {
    return [...matching].sort((a, b) =>
      a.pet.name.localeCompare(b.pet.name, "en"),
    );
  }
  if (filters.order === "level") {
    return [...matching].sort((a, b) => b.level - a.level);
  }
  return matching;
};

export const rarityCounts = (views: PetView[]) =>
  new Map<PetRarity, number>(
    [...new Set(views.map((view) => view.pet.rarity))].map((rarity) => [
      rarity,
      views.filter((view) => view.pet.rarity === rarity).length,
    ]),
  );

export type PetChange =
  | { kind: "unlocked"; petId: string; unlocked: boolean }
  | { kind: "level"; petId: string; level: number }
  | { kind: "advanced"; petId: string; advanced: boolean }
  | { kind: "refine"; petId: string; index: number; value: number };

const savedState = (chief: Playthrough, pet: Pet): Required<PetState> => {
  const view = buildPetView(chief, pet);
  return {
    unlocked: view.unlocked,
    level: view.level,
    advanced: view.advanced,
    refine: view.refine,
  };
};

export const applyPetChange = (
  chief: Playthrough,
  change: PetChange,
): Playthrough => {
  const pet = findPet(change.petId) as Pet;
  const state = savedState(chief, pet);
  let next: Required<PetState> = state;

  if (change.kind === "unlocked")
    next = { ...state, unlocked: change.unlocked };
  if (change.kind === "level") {
    const level = clampInt(change.level, 1, pet.maxLevel);
    next = {
      ...state,
      level,
      advanced: isAdvanceLevel(level) && state.advanced,
    };
  }
  if (change.kind === "advanced") {
    next = {
      ...state,
      advanced: isAdvanceLevel(state.level) && change.advanced,
    };
  }
  if (change.kind === "refine") {
    next = {
      ...state,
      refine: state.refine.map((value, index) =>
        index === change.index ? clampRefine(change.value, pet) : value,
      ),
    };
  }

  return { ...chief, pets: { ...chief.pets, [pet.id]: next } };
};

export type PetGoals = Record<string, PetGoalState>;

/**
 * The goals a plan starts from: the saved goals of unlocked pets, with a goal below the current
 * level raised to it.
 */
export const initialPetGoals = (chief: Playthrough): PetGoals =>
  Object.fromEntries(
    buildPetViews(chief)
      .filter((view) => view.unlocked && view.goal)
      .map((view) => [view.pet.id, normalizeGoal(withFloor(view), view.pet)]),
  );

const withFloor = (view: PetView): PetGoalState => ({
  level: Math.max(view.goal?.level ?? view.level, view.level),
  advanceAtGoal: view.goal?.advanceAtGoal ?? false,
});

export const startingPetGoal = (view: PetView): PetGoalState => ({
  level: view.level,
  advanceAtGoal: false,
});

export const withGoalLevel = (
  view: PetView,
  goal: PetGoalState,
  level: number,
): PetGoalState =>
  normalizeGoal(
    { level: Math.max(level, view.level), advanceAtGoal: goal.advanceAtGoal },
    view.pet,
  );

export const withSavedPetsPlan = (
  chief: Playthrough,
  goals: PetGoals,
  savedAt: string,
): Playthrough => {
  const plan: PetsPlanState = { goals, savedAt };
  return { ...chief, petsPlan: plan };
};

export interface PetPlanRow {
  view: PetView;
  goal: PetGoalState;
  calculation: PetItemResult;
  paysCurrentAdvancement: boolean;
}

export interface PetPlanResult {
  rows: PetPlanRow[];
  total: PetCalculation;
  totalPower: number | null;
  needs: Record<string, number>;
}

const goalInput = (view: PetView, goal: PetGoalState): PetGoal => ({
  id: view.pet.id,
  current: view.level,
  goal: goal.level,
  currentAdvanced: view.advanced,
  goalAdvanced: goal.advanceAtGoal && isAdvanceLevel(goal.level),
});

export const runPetPlan = (
  chief: Playthrough,
  goals: PetGoals,
): PetPlanResult => {
  const planned = buildPetViews(chief).filter(
    (view) => view.unlocked && goals[view.pet.id],
  );
  const inputs = planned.map((view) => goalInput(view, goals[view.pet.id]));
  const result = calculatePets(inputs);

  return {
    rows: planned.map((view, index) => ({
      view,
      goal: goals[view.pet.id],
      calculation: result.items[index],
      paysCurrentAdvancement:
        view.canAdvance &&
        !view.advanced &&
        goals[view.pet.id].level > view.level,
    })),
    total: result,
    totalPower: Number.isFinite(result.power) ? result.power : null,
    needs: Object.fromEntries(
      PLAN_ITEM_IDS.map((id) => [
        id,
        result.resources.find((resource) => resource.itemId === id)?.amount ??
          0,
      ]),
    ),
  };
};

export const petPowerGain = (calculation: PetCalculation | PetItemResult) =>
  Number.isFinite(calculation.power) ? calculation.power : null;

export const petPlanChecks = (
  plan: PetPlanResult,
  chief: Playthrough,
): StockCheck[] =>
  PLAN_ITEM_IDS.map((id) => ({
    id,
    name: findItem(id)?.name ?? id,
    available: ownedCount(chief, id),
    needed: plan.needs[id],
  }));

/**
 * The Construction Speed percent of the Cave Hyena skill at its current tier. A locked pet adds
 * nothing. The Buildings Plan adds this percent when its Pet skill switch is on.
 */
export const petSkillConstructionPercent = (chief: Playthrough) => {
  const view = buildPetView(chief, findPet(CONSTRUCTION_PET_ID) as Pet);
  return view.unlocked
    ? view.pet.skill.values[skillTierOf(view.pet, view.level) - 1]
    : 0;
};

/**
 * The `pets` list of a `calculateBuffs` profile: every unlocked pet at its level, refined when
 * advanced, with its six refinement percents.
 */
export const petBuffInputs = (chief: Playthrough): BuffPet[] =>
  unlockedViews(buildPetViews(chief)).map((view) => ({
    id: view.pet.id,
    level: view.level,
    refined: view.advanced,
    refinement: Object.fromEntries(
      PET_REFINEMENT_STATS.map((stat, index) => [
        stat.statKey,
        view.refine[index],
      ]),
    ) as BuffPet["refinement"],
  }));
