import {
  estimateHeroStats,
  HERO_UPGRADE_CALCULATOR,
  heroes,
  heroWidgets,
  items,
} from "whiteout-survival-data";
import type { Hero, HeroRarity, HeroSkill } from "whiteout-survival-data";

export const allHeroes: Hero[] = heroes().get();

export const findHero = (id: string) => heroes().find(id);

export { estimateHeroStats };

export const MAX_STAR = HERO_UPGRADE_CALCULATOR.maxStar;
export const MAX_TIER = HERO_UPGRADE_CALCULATOR.maxTier;
export const MAX_WEAPON_LEVEL = HERO_UPGRADE_CALCULATOR.maxWidgetLevel;
export const MAX_HERO_LEVEL = 80;
export const MAX_SKILL_LEVEL = 5;
export const MAX_TALENT_LEVEL = 5;

export const widgetCostOf = (level: number) =>
  heroWidgets().find(`level-${level}`)?.widgets ?? 0;

export const heroRarities: HeroRarity[] = ["Legendary", "Epic", "Rare"];
export const heroClasses = ["Infantry", "Lancer", "Marksman"] as const;

/**
 * The general shard item of a rarity. A hero uses its own shards first and the general shards
 * cover the rest.
 */
export const generalShardItemId = (rarity: HeroRarity) =>
  `${rarity === "Legendary" ? "mythic" : rarity.toLowerCase()}-general-hero-shard`;

export const manualItemId = (
  rarity: HeroRarity,
  branch: "exploration" | "expedition",
) =>
  `${rarity === "Legendary" ? "mythic" : rarity.toLowerCase()}-${branch}-skill-manual`;

/**
 * The levels of a skill that a star allows. Level 1 of a skill needs its unlock star, so a skill
 * below that star stays at level 0, and each next level needs the star of its own row.
 */
export const skillLevelRange = (skill: HeroSkill, star: number) => {
  const max = skill.levels.filter((level) => level.starRequired <= star).length;
  return { min: max > 0 ? 1 : 0, max };
};

export const skillsOf = (
  hero: Hero,
): { branch: "exploration" | "expedition"; skill: HeroSkill }[] => [
  ...hero.skills.exploration.map((skill) => ({
    branch: "exploration" as const,
    skill,
  })),
  ...hero.skills.expedition.map((skill) => ({
    branch: "expedition" as const,
    skill,
  })),
];

const shardItemIdByImage = new Map(
  items()
    .get()
    .map((item) => [item.img, item.id]),
);

/**
 * The item that holds the shards of one hero on the Resources page. The package links them by
 * the shard icon, and a hero with no shard icon has no item yet.
 */
export const shardItemIdOf = (hero: Hero) =>
  hero.shardImg ? (shardItemIdByImage.get(hero.shardImg) ?? null) : null;
