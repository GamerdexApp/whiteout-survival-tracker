import { translator } from "@/i18n/formatter";
import { calculateHeroUpgrade } from "whiteout-survival-data";
import type {
  Hero,
  HeroUpgradeCalculation,
  UnmetHeroSkillRequirement,
} from "whiteout-survival-data";
import type { HeroGoal, HeroState, Playthrough } from "@/types/app";
import { furnace, FURNACE_ID } from "@/data/game/buildings";
import {
  allHeroes,
  generalShardItemId,
  MAX_HERO_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_STAR,
  MAX_TALENT_LEVEL,
  MAX_TIER,
  MAX_WEAPON_LEVEL,
  shardItemIdOf,
  skillLevelRange,
  skillsOf,
} from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import { levelOrder } from "./buildings";
import { ownedCount, withOwnedCount } from "./inventory";
import type { StockCheck } from "./planStock";

export interface StarLabel {
  star: number;
  tier: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(
    max,
    Math.max(min, Math.floor(Number.isFinite(value) ? value : min)),
  );

export const starPosition = ({ star, tier }: StarLabel) =>
  star * (MAX_TIER + 1) + tier;

export const MAX_STAR_POSITION = starPosition({ star: MAX_STAR, tier: 0 });

export const starLabelAt = (position: number): StarLabel => {
  const clamped = clamp(position, 0, MAX_STAR_POSITION);
  return {
    star: Math.floor(clamped / (MAX_TIER + 1)),
    tier: clamped % (MAX_TIER + 1),
  };
};

export const formatStars = ({ star, tier }: StarLabel) => `${star}.${tier}`;

export const starStops = Array.from(
  { length: MAX_STAR_POSITION + 1 },
  (_, position) => {
    const label = formatStars(starLabelAt(position));
    return { value: label, label };
  },
);

export const parseStars = (value: string): StarLabel => {
  const [star, tier] = value.split(".").map(Number);
  return starLabelAt(starPosition({ star, tier }));
};

export const unlockedHeroes = (chief: Playthrough) =>
  allHeroes.filter((hero) => hero.generation <= chief.heroGenerationUnlocked);

export interface HeroView {
  hero: Hero;
  owned: boolean;
  stars: StarLabel;
  level: number;
  skillLevels: Record<string, number>;
  talent: number;
  weapon: number;
  shards: number;
  goal: HeroGoal | null;
}

/**
 * A hero with a shard item shares its count with the Resources page, so the count lives in the
 * inventory. A count saved on the hero before that stays as the fallback until the next edit.
 */
export const shardsOf = (chief: Playthrough, hero: Hero) => {
  const itemId = shardItemIdOf(hero);
  const held = itemId ? chief.inventory?.[itemId] : undefined;
  return Math.max(0, Math.floor(held ?? chief.heroes?.[hero.id]?.shards ?? 0));
};

const savedStars = (state: HeroState | undefined): StarLabel => {
  const star = clamp(state?.star ?? 0, 0, MAX_STAR);
  const tier = star === MAX_STAR ? 0 : clamp(state?.tier ?? 0, 0, MAX_TIER);
  return { star, tier };
};

export const buildHeroView = (chief: Playthrough, hero: Hero): HeroView => {
  const state = chief.heroes?.[hero.id];
  const stars = savedStars(state);
  const skillLevels = Object.fromEntries(
    skillsOf(hero).map(({ skill }) => {
      const { min, max } = skillLevelRange(skill, stars.star);
      return [skill.name, clamp(state?.skills?.[skill.name] ?? min, min, max)];
    }),
  );
  const savedGoal = chief.heroesPlan?.goals?.[hero.id];

  return {
    hero,
    owned: state?.owned === true,
    stars,
    level: clamp(state?.level ?? 1, 1, MAX_HERO_LEVEL),
    skillLevels,
    talent: clamp(state?.talent ?? 1, 1, MAX_TALENT_LEVEL),
    weapon: hero.exclusiveWeapon
      ? clamp(state?.weapon ?? 0, 0, MAX_WEAPON_LEVEL)
      : 0,
    shards: shardsOf(chief, hero),
    goal: savedGoal ?? null,
  };
};

export const buildHeroViews = (chief: Playthrough) =>
  unlockedHeroes(chief).map((hero) => buildHeroView(chief, hero));

export const hasStarGoal = (view: HeroView) =>
  view.goal !== null &&
  starPosition({ star: view.goal.star, tier: view.goal.tier }) >
    starPosition(view.stars);

export const skillGoalOf = (view: HeroView, skillName: string) => {
  const goal = view.goal?.skills?.[skillName];
  return goal !== undefined && goal > view.skillLevels[skillName] ? goal : null;
};

export const weaponGoalOf = (view: HeroView) => {
  const goal = view.goal?.weapon;
  return goal !== undefined && goal > view.weapon ? goal : null;
};

export const hasAnyGoal = (view: HeroView) =>
  hasStarGoal(view) ||
  weaponGoalOf(view) !== null ||
  skillsOf(view.hero).some(
    ({ skill }) => skillGoalOf(view, skill.name) !== null,
  );

/**
 * A goal that only restates the current values holds nothing, so the plan keeps goals above
 * the current state and drops the rest.
 */
export const effectiveGoal = (view: HeroView): HeroGoal | null => {
  if (!view.goal) return null;
  const skills = Object.fromEntries(
    skillsOf(view.hero)
      .map(({ skill }) => [skill.name, skillGoalOf(view, skill.name)] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] !== null),
  );
  const weapon = weaponGoalOf(view) ?? undefined;
  const stars = hasStarGoal(view)
    ? { star: view.goal.star, tier: view.goal.tier }
    : { ...view.stars };
  const goal: HeroGoal = { ...stars };
  if (Object.keys(skills).length > 0) goal.skills = skills;
  if (weapon !== undefined) goal.weapon = weapon;
  return hasAnyGoal(view) ? goal : null;
};

export const powerOfLevel = (hero: Hero, level: number) => {
  const power = hero.levels[level - 1]?.power ?? 0;
  return power > 0 ? power : null;
};

export interface HeroPowerParts {
  level: number | null;
  skills: number;
  star: number | null;
  weapon: number | null;
  total: number | null;
}

/**
 * The shard power at a star label. Label 0.0 uses the power at star 0, and a later label uses
 * the power of its tier. A label without a tier power, or with a 0 placeholder, is unknown.
 */
export const starPowerAt = (hero: Hero, stars: StarLabel): number | null => {
  const position = starPosition(stars);
  if (position === 0) return hero.powerAtStarZero ?? null;

  const costs = hero.shardCosts[Math.floor((position - 1) / (MAX_TIER + 1))];
  const power = costs.tierPower?.[(position - 1) % (MAX_TIER + 1)] ?? 0;
  return power > 0 ? power : null;
};

const weaponPowerAt = (hero: Hero, level: number) =>
  hero.exclusiveWeapon && level > 0
    ? (hero.exclusiveWeapon.levels[level - 1]?.power ?? null)
    : 0;

/**
 * The power of a hero is its level power, the power of its skill levels (the package gives the total at that level, not the gain), the shard power of its
 * star label and the power of its exclusive weapon level. A part the package marks with a 0
 * placeholder reads as unknown, and so does the total.
 */
export const heroPowerParts = (view: HeroView): HeroPowerParts => {
  const level = powerOfLevel(view.hero, view.level);
  const skills = skillsOf(view.hero).reduce(
    (total, { skill }) =>
      total + (skill.levels[view.skillLevels[skill.name] - 1]?.powerGain ?? 0),
    0,
  );
  const star = starPowerAt(view.hero, view.stars);
  const weapon = weaponPowerAt(view.hero, view.weapon);
  const known = level !== null && star !== null && weapon !== null;
  return {
    level,
    skills,
    star,
    weapon,
    total: known ? level + skills + star + weapon : null,
  };
};

export interface FurnaceCheck {
  requiredLabel: string;
  met: boolean;
}

export const furnaceCheck = (
  chief: Playthrough,
  hero: Hero,
  level: number,
): FurnaceCheck => {
  const requiredLabel = String(hero.levels[level - 1].furnaceLevelRequired);
  const held = levelOrder(furnace, chief.buildings?.[FURNACE_ID]?.level);
  return { requiredLabel, met: held >= levelOrder(furnace, requiredLabel) };
};

export const shardsNeededForGoal = (view: HeroView) => {
  const goal = effectiveGoal(view);
  if (!goal || !hasStarGoal(view)) return 0;
  return calculateHeroUpgrade({
    id: view.hero.id,
    stars: {
      current: view.stars,
      goal: { star: goal.star, tier: goal.tier },
    },
  }).stars.shards;
};

export type OwnedFilter = "all" | "owned" | "notOwned";
export type HeroOrder = "owned" | "generation" | "name" | "power";

export interface HeroFilters {
  search: string;
  generation: number | "all";
  rarity: Hero["rarity"] | "all";
  heroClass: Hero["class"] | "all";
  ownership: OwnedFilter;
  order: HeroOrder;
}

export const defaultHeroFilters = (): HeroFilters => ({
  search: "",
  generation: "all",
  rarity: "all",
  heroClass: "all",
  ownership: "all",
  order: "generation",
});

export const countHeroFilters = (filters: HeroFilters) =>
  [
    filters.generation !== "all",
    filters.rarity !== "all",
    filters.heroClass !== "all",
    filters.ownership !== "all",
    filters.order !== "generation",
  ].filter(Boolean).length;

const totalPowerOf = (view: HeroView) => heroPowerParts(view).total ?? 0;

const orderCompare: Record<HeroOrder, (a: HeroView, b: HeroView) => number> = {
  owned: (a, b) =>
    Number(b.owned) - Number(a.owned) || b.hero.generation - a.hero.generation,
  generation: (a, b) => b.hero.generation - a.hero.generation,
  name: (a, b) => a.hero.name.localeCompare(b.hero.name),
  power: (a, b) => totalPowerOf(b) - totalPowerOf(a),
};

export const filterHeroViews = (views: HeroView[], filters: HeroFilters) => {
  const search = filters.search.trim().toLowerCase();
  return views
    .filter(
      ({ hero, owned }) =>
        (search === "" || hero.name.toLowerCase().includes(search)) &&
        (filters.generation === "all" ||
          hero.generation === filters.generation) &&
        (filters.rarity === "all" || hero.rarity === filters.rarity) &&
        (filters.heroClass === "all" || hero.class === filters.heroClass) &&
        (filters.ownership === "all" ||
          (filters.ownership === "owned") === owned),
    )
    .sort(
      (a, b) =>
        orderCompare[filters.order](a, b) ||
        a.hero.name.localeCompare(b.hero.name),
    );
};

export interface HeroSummary {
  unlockedGenerations: number;
  owned: number;
  total: number;
  legendaryOwned: number;
  legendaryTotal: number;
  atMaxLevel: number;
  withGoal: number;
  power: number;
  unknownPower: number;
}

export const summarizeHeroes = (
  views: HeroView[],
  chief: Playthrough,
): HeroSummary => {
  const legendary = views.filter((view) => view.hero.rarity === "Legendary");
  const ownedPowers = views
    .filter((view) => view.owned)
    .map((view) => heroPowerParts(view).total);
  return {
    unlockedGenerations: chief.heroGenerationUnlocked,
    owned: views.filter((view) => view.owned).length,
    total: views.length,
    legendaryOwned: legendary.filter((view) => view.owned).length,
    legendaryTotal: legendary.length,
    atMaxLevel: views.filter(
      (view) => view.owned && view.level === MAX_HERO_LEVEL,
    ).length,
    withGoal: views.filter((view) => view.owned && hasAnyGoal(view)).length,
    power: ownedPowers.reduce<number>(
      (total, power) => total + (power ?? 0),
      0,
    ),
    unknownPower: ownedPowers.filter((power) => power === null).length,
  };
};

const withHeroState = (
  chief: Playthrough,
  heroId: string,
  patch: Partial<HeroState>,
): Playthrough => ({
  ...chief,
  heroes: {
    ...chief.heroes,
    [heroId]: { ...chief.heroes?.[heroId], ...patch },
  },
});

export const withHeroOwned = (
  chief: Playthrough,
  heroId: string,
  owned: boolean,
) => withHeroState(chief, heroId, { owned });

export const withHeroStars = (
  chief: Playthrough,
  heroId: string,
  stars: StarLabel,
) => withHeroState(chief, heroId, { star: stars.star, tier: stars.tier });

export const withHeroLevel = (
  chief: Playthrough,
  heroId: string,
  level: number,
) => withHeroState(chief, heroId, { level: clamp(level, 1, MAX_HERO_LEVEL) });

export const withHeroSkill = (
  chief: Playthrough,
  heroId: string,
  skillName: string,
  level: number,
) =>
  withHeroState(chief, heroId, {
    skills: {
      ...chief.heroes?.[heroId]?.skills,
      [skillName]: clamp(level, 0, MAX_SKILL_LEVEL),
    },
  });

export const withHeroTalent = (
  chief: Playthrough,
  heroId: string,
  level: number,
) =>
  withHeroState(chief, heroId, { talent: clamp(level, 1, MAX_TALENT_LEVEL) });

export const withHeroWeapon = (
  chief: Playthrough,
  heroId: string,
  level: number,
) =>
  withHeroState(chief, heroId, { weapon: clamp(level, 0, MAX_WEAPON_LEVEL) });

export const withHeroShards = (
  chief: Playthrough,
  heroId: string,
  shards: number,
): Playthrough => {
  const count = Math.max(0, Math.floor(Number.isFinite(shards) ? shards : 0));
  const hero = allHeroes.find((item) => item.id === heroId);
  const itemId = hero ? shardItemIdOf(hero) : null;
  if (!itemId) return withHeroState(chief, heroId, { shards: count });

  const state = { ...chief.heroes?.[heroId] };
  delete state.shards;
  return withOwnedCount(
    { ...chief, heroes: { ...chief.heroes, [heroId]: state } },
    itemId,
    count,
  );
};

export const withSavedHeroesPlan = (
  chief: Playthrough,
  goals: Record<string, HeroGoal>,
  savedAt: string,
): Playthrough => ({ ...chief, heroesPlan: { goals, savedAt } });

/**
 * The rows a plan opens with: every owned hero that has a goal above its current state.
 */
export const initialHeroGoals = (chief: Playthrough) =>
  Object.fromEntries(
    buildHeroViews(chief)
      .filter((view) => view.owned)
      .flatMap((view) => {
        const goal = effectiveGoal(view);
        return goal ? [[view.hero.id, goal] as const] : [];
      }),
  );

export const startingGoalFor = (view: HeroView): HeroGoal => ({
  ...view.stars,
});

export interface HeroPlanRow {
  view: HeroView;
  goal: HeroGoal;
  calculation: HeroUpgradeCalculation;
}

export interface UnmetRequirement extends UnmetHeroSkillRequirement {
  heroName: string;
}

export interface HeroPlanResult {
  rows: HeroPlanRow[];
  resources: Map<string, number>;
  widgets: number;
  unlockedWeaponSkills: number;
  starSteps: number;
  skillLevels: number;
  weaponLevels: number;
  eventPoints: HeroUpgradeCalculation["eventPoints"];
  unmet: UnmetRequirement[];
}

const goalToCalculatorInput = (view: HeroView, goal: HeroGoal) => {
  const goalStars = { star: goal.star, tier: goal.tier };
  const starsGoal =
    starPosition(goalStars) > starPosition(view.stars) ? goalStars : view.stars;
  const skills = skillsOf(view.hero)
    .map(({ skill }) => ({
      name: skill.name,
      current: Math.max(1, view.skillLevels[skill.name]),
      goal: Math.max(
        1,
        goal.skills?.[skill.name] ?? view.skillLevels[skill.name],
      ),
    }))
    .filter((skill) => skill.goal > skill.current);
  const weaponGoal = view.hero.exclusiveWeapon
    ? (goal.weapon ?? view.weapon)
    : 0;

  return {
    id: view.hero.id,
    stars: { current: view.stars, goal: starsGoal },
    skills,
    widgets: view.hero.exclusiveWeapon
      ? { current: view.weapon, goal: Math.max(weaponGoal, view.weapon) }
      : undefined,
  };
};

/**
 * Runs the calculator once per hero and adds the results. A hero that is not owned or not
 * unlocked is left out.
 */
export const runHeroPlan = (
  chief: Playthrough,
  goals: Record<string, HeroGoal>,
): HeroPlanResult => {
  const views = new Map(
    buildHeroViews(chief).map((view) => [view.hero.id, view] as const),
  );
  const rows = Object.entries(goals).flatMap(([heroId, goal]) => {
    const view = views.get(heroId);
    return view?.owned
      ? [
          {
            view,
            goal,
            calculation: calculateHeroUpgrade(
              goalToCalculatorInput(view, goal),
            ),
          },
        ]
      : [];
  });

  const resources = new Map<string, number>();
  rows.forEach(({ calculation }) =>
    calculation.resources.forEach(({ itemId, amount }) =>
      resources.set(itemId, (resources.get(itemId) ?? 0) + amount),
    ),
  );

  const sum = (pick: (row: HeroPlanRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const points = (key: keyof HeroUpgradeCalculation["eventPoints"]) =>
    sum((row) => row.calculation.eventPoints[key]);

  return {
    rows,
    resources,
    widgets: sum((row) => row.calculation.widgets.widgets),
    unlockedWeaponSkills: sum(
      (row) => row.calculation.widgets.unlockedSkills.length,
    ),
    starSteps: sum((row) => row.calculation.stars.steps),
    skillLevels: sum((row) => row.calculation.skills.levels),
    weaponLevels: sum((row) => row.calculation.widgets.levels),
    eventPoints: {
      svs: points("svs"),
      allianceShowdown: points("allianceShowdown"),
      kingOfIcefield: points("kingOfIcefield"),
      hallOfChief: points("hallOfChief"),
    },
    unmet: rows.flatMap((row) =>
      row.calculation.unmetRequirements.map((requirement) => ({
        ...requirement,
        heroName: row.view.hero.name,
      })),
    ),
  };
};

export interface ShardUse {
  fromOwnHero: number;
  fromGeneral: number;
  total: number;
}

/**
 * Each hero spends its own shards first. What it is still short comes from the general shards of
 * its rarity, which is what the stock check compares with the Resources page.
 */
export const shardUse = (plan: HeroPlanResult): ShardUse => {
  const uses = plan.rows.map((row) => {
    const needed = row.calculation.stars.shards;
    const fromOwnHero = Math.min(needed, row.view.shards);
    return { fromOwnHero, fromGeneral: needed - fromOwnHero };
  });
  const fromOwnHero = uses.reduce((total, use) => total + use.fromOwnHero, 0);
  const fromGeneral = uses.reduce((total, use) => total + use.fromGeneral, 0);
  return { fromOwnHero, fromGeneral, total: fromOwnHero + fromGeneral };
};

const RARITY_ORDER: Hero["rarity"][] = ["Legendary", "Epic", "Rare"];

const rarityShardName = (rarity: Hero["rarity"]) =>
  translator("heroes")(`service.generalShard.${rarity}`);

export const heroPlanChecks = (
  plan: HeroPlanResult,
  chief: Playthrough,
): StockCheck[] => {
  const shardChecks = RARITY_ORDER.map((rarity) => {
    const rows = plan.rows.filter((row) => row.view.hero.rarity === rarity);
    const needed = rows.reduce(
      (total, row) =>
        total + Math.max(0, row.calculation.stars.shards - row.view.shards),
      0,
    );
    return {
      id: generalShardItemId(rarity),
      name: rarityShardName(rarity),
      available: ownedCount(chief, generalShardItemId(rarity)),
      needed,
    };
  }).filter((check) => check.needed > 0);

  const manualChecks = [...plan.resources.entries()]
    .filter(([itemId]) => itemId.endsWith("-skill-manual"))
    .map(([itemId, needed]) => ({
      id: itemId,
      name: findItem(itemId)?.name ?? itemId,
      available: ownedCount(chief, itemId),
      needed,
    }));

  return [...shardChecks, ...manualChecks];
};

export type HeroChange =
  | { kind: "owned"; heroId: string; owned: boolean }
  | { kind: "stars"; heroId: string; stars: StarLabel }
  | { kind: "level"; heroId: string; level: number }
  | { kind: "skill"; heroId: string; skill: string; level: number }
  | { kind: "talent"; heroId: string; level: number }
  | { kind: "weapon"; heroId: string; level: number }
  | { kind: "shards"; heroId: string; shards: number };

export const applyHeroChange = (
  chief: Playthrough,
  change: HeroChange,
): Playthrough => {
  switch (change.kind) {
    case "owned":
      return withHeroOwned(chief, change.heroId, change.owned);
    case "stars":
      return withHeroStars(chief, change.heroId, change.stars);
    case "level":
      return withHeroLevel(chief, change.heroId, change.level);
    case "skill":
      return withHeroSkill(chief, change.heroId, change.skill, change.level);
    case "talent":
      return withHeroTalent(chief, change.heroId, change.level);
    case "weapon":
      return withHeroWeapon(chief, change.heroId, change.level);
    case "shards":
      return withHeroShards(chief, change.heroId, change.shards);
  }
};

export interface MaxOutOptions {
  scope: "owned" | "unlocked" | "selected";
  heroIds: string[];
  starAndTier: boolean;
  level: boolean;
  skills: boolean;
  weapon: boolean;
}

export const defaultMaxOutOptions = (): MaxOutOptions => ({
  scope: "owned",
  heroIds: [],
  starAndTier: true,
  level: true,
  skills: true,
  weapon: true,
});

export const maxOutTargets = (chief: Playthrough, options: MaxOutOptions) =>
  buildHeroViews(chief).filter((view) => {
    if (options.scope === "unlocked") return true;
    if (options.scope === "selected")
      return options.heroIds.includes(view.hero.id);
    return view.owned;
  });

/**
 * Raises the chosen tracks of every target hero to the top. A track that is switched off is left
 * as it is, so a hero with maxed skills can keep level 1. Goals and shard counts are not touched.
 */
export const withMaxedHeroes = (
  chief: Playthrough,
  options: MaxOutOptions,
): Playthrough => {
  const heroes = { ...chief.heroes };
  maxOutTargets(chief, options).forEach((view) => {
    const patch: HeroState = { ...heroes[view.hero.id], owned: true };
    if (options.starAndTier) {
      patch.star = MAX_STAR;
      patch.tier = 0;
    }
    if (options.level) patch.level = MAX_HERO_LEVEL;
    if (options.skills) {
      patch.skills = Object.fromEntries(
        skillsOf(view.hero).map(({ skill }) => [skill.name, MAX_SKILL_LEVEL]),
      );
      if (view.hero.skills.talent) patch.talent = MAX_TALENT_LEVEL;
    }
    if (options.weapon && view.hero.exclusiveWeapon)
      patch.weapon = MAX_WEAPON_LEVEL;
    heroes[view.hero.id] = patch;
  });
  return { ...chief, heroes };
};
