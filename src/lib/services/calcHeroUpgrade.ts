import type {
  Hero,
  HeroStatEstimate,
  HeroUpgradeGoal,
} from "@/data/game/calcHeroUpgrade";
import {
  allHeroes,
  estimateHeroStats,
  heroRarities,
  MAX_WEAPON_LEVEL,
  skillsOf,
} from "@/data/game/heroes";
import { MAX_STAR_POSITION, starLabelAt, starPowerAt } from "./heroes";

export interface LevelRange {
  current: number;
  goal: number;
}

/** Stars hold star positions, so 0 is label 0.0 and `MAX_STAR_POSITION` is label 5.0. */
export interface HeroUpgradeInputs {
  stars: LevelRange;
  skills: Record<string, LevelRange>;
  widgets: LevelRange;
}

export const heroGroups = heroRarities.map((rarity) => ({
  rarity,
  heroes: allHeroes.filter((hero) => hero.rarity === rarity),
}));

export const DEFAULT_HERO = heroGroups[0].heroes[0];

/** The hero picker offers only package heroes, so every id it returns exists. */
export const heroById = (id: string) =>
  allHeroes.find((hero) => hero.id === id) as Hero;

export const freshInputs = (hero: Hero): HeroUpgradeInputs => ({
  stars: { current: 0, goal: 0 },
  skills: Object.fromEntries(
    skillsOf(hero).map(({ skill }) => [skill.name, { current: 1, goal: 1 }]),
  ),
  widgets: { current: 0, goal: 0 },
});

export const withCurrent = (range: LevelRange, current: number) => ({
  current,
  goal: Math.max(range.goal, current),
});

export const levelsBetween = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

export const starPositions = levelsBetween(0, MAX_STAR_POSITION);
export const weaponLevels = levelsBetween(0, MAX_WEAPON_LEVEL);

export const heroUpgradeGoalOf = (
  hero: Hero,
  inputs: HeroUpgradeInputs,
): HeroUpgradeGoal => ({
  id: hero.id,
  stars: {
    current: starLabelAt(inputs.stars.current),
    goal: starLabelAt(inputs.stars.goal),
  },
  skills: skillsOf(hero).map(({ skill }) => ({
    name: skill.name,
    ...inputs.skills[skill.name],
  })),
  widgets: hero.exclusiveWeapon ? inputs.widgets : undefined,
});

const weaponPowerAt = (hero: Hero, level: number) =>
  level === 0 || !hero.exclusiveWeapon
    ? 0
    : hero.exclusiveWeapon.levels[level - 1].power;

/** A star label with a 0 placeholder power makes the star gain unknown. */
const starPowerGainOf = (hero: Hero, stars: LevelRange): number | null => {
  if (stars.goal === stars.current) return 0;
  const current = starPowerAt(hero, starLabelAt(stars.current));
  const goal = starPowerAt(hero, starLabelAt(stars.goal));
  return current === null || goal === null ? null : goal - current;
};

/**
 * The power the upgrade adds, or null when the star part is unknown. A skill level holds the
 * total power at that level, not the gain.
 */
export const powerGainOf = (
  hero: Hero,
  inputs: HeroUpgradeInputs,
): number | null => {
  const starGain = starPowerGainOf(hero, inputs.stars);
  if (starGain === null) return null;

  const skillGain = skillsOf(hero).reduce((total, { skill }) => {
    const range = inputs.skills[skill.name];
    return (
      total +
      skill.levels[range.goal - 1].powerGain -
      skill.levels[range.current - 1].powerGain
    );
  }, 0);
  const weaponGain =
    weaponPowerAt(hero, inputs.widgets.goal) -
    weaponPowerAt(hero, inputs.widgets.current);
  return starGain + skillGain + weaponGain;
};

export interface StarStats {
  current: HeroStatEstimate;
  goal: HeroStatEstimate;
}

export const starStatsOf = (hero: Hero, stars: LevelRange): StarStats => {
  const current = starLabelAt(stars.current);
  const goal = starLabelAt(stars.goal);
  return {
    current: estimateHeroStats(hero, current.star, current.tier),
    goal: estimateHeroStats(hero, goal.star, goal.tier),
  };
};
