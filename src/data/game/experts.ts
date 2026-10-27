import {
  EXPERT_LEARNING_QUEUE_OPTIONS,
  EXPERT_MAX_LEVEL,
  EXPERT_SKILL_EXP_PER_LEARNING_MINUTE,
  expertRelationships,
  experts,
  expertSkillMaxLevel,
  items,
  unreleasedExperts,
} from "whiteout-survival-data";
import type {
  Expert,
  ExpertAffinityLevel,
  ExpertRelationship,
  ExpertSkill,
} from "whiteout-survival-data";

export const allExperts: Expert[] = experts().get();

const hasStatBonuses = (expert: Expert) =>
  expert.affinityLevels.every((level) => level.statBonus !== undefined);

/** The experts that the tracker can follow, which have a stat bonus on every affinity level. */
export const trackedExperts: Expert[] = allExperts.filter(hasStatBonuses);

/** The stat bonus of an affinity row of a tracked expert, which always has one. */
export const statBonusOf = (row: ExpertAffinityLevel) => row.statBonus!;

export const findExpert = (id: string) => experts().find(id);

/** The name of an expert the game has not released. It is on the server timeline only. */
export const unreleasedExpertName = (id: string) =>
  unreleasedExperts().find(id)?.name;

/** Experts the game has not released yet. They show on the Wiki but have no page. */
export const unreleasedExpertList = unreleasedExperts().get();

export const MAX_AFFINITY = EXPERT_MAX_LEVEL;
export const EXP_PER_LEARNING_MINUTE = EXPERT_SKILL_EXP_PER_LEARNING_MINUTE;
export const ADVANCEMENT_INTERVAL = 10;
export const COMMON_SIGIL_ITEM_ID = "common-expert-sigil";
export const BOOK_ITEM_ID = "book-of-knowledge";

export const expertGenerations = [
  ...new Set(allExperts.map((expert) => expert.generation)),
].sort((a, b) => a - b);

export const relationships: ExpertRelationship[] = expertRelationships().get();

export const relationshipNumberAt = (affinity: number) =>
  relationships.filter((relationship) => relationship.level <= affinity).length;

export const relationshipAt = (affinity: number) =>
  relationships[relationshipNumberAt(affinity) - 1];

export const skillPowerAt = (skill: ExpertSkill, level: number) =>
  skill.progressions?.find((progression) => progression.label === "Power")
    ?.values[level - 1] ?? 0;

export const nextLevelCostOf = (skill: ExpertSkill, level: number) =>
  skill.costs?.find((cost) => cost.level === level + 1)?.exp ?? 0;

const sigilItemIdByExpertId = new Map(
  allExperts.map((expert) => [
    expert.id,
    items()
      .get()
      .find(
        (item) =>
          item.id.endsWith("sigil") &&
          item.name.replace("’", "'").startsWith(expert.name),
      )?.id ?? null,
  ]),
);

export const sigilItemIdOf = (expertId: string) =>
  sigilItemIdByExpertId.get(expertId) ?? null;

/** The learning sessions of the game: a label, the minutes and the EXP they earn. */
export const learningSessions = [...EXPERT_LEARNING_QUEUE_OPTIONS];

export { expertSkillMaxLevel };

const AFFINITY_STEP = 10;

/**
 * The affinity level that a skill level needs. The data lists the levels that raise the need, and
 * a level keeps the need of the last row at or below it. It is 0 for a skill with no rows.
 */
export const affinityNeededForSkillLevel = (
  skill: ExpertSkill,
  level: number,
) =>
  (skill.affinityRequirements ?? [])
    .filter((row) => row.level <= level)
    .reduce((most, row) => Math.max(most, row.affinityLevel), 0);

/**
 * The total of the four skill levels that a skill level needs before the upgrade. A level keeps
 * the need of the last row at or below it. It is 0 for a skill with no rows.
 */
export const totalSkillNeededForLevel = (skill: ExpertSkill, level: number) =>
  (skill.totalSkillRequirements ?? [])
    .filter((row) => row.level <= level)
    .reduce((most, row) => Math.max(most, row.totalSkillLevel), 0);

/**
 * The highest level of a skill that an affinity level allows, from the unlock, the caps and the
 * affinity that each level needs. A talent has no such rules and returns its max level.
 */
export const skillMaxLevelAtAffinity = (
  skill: ExpertSkill,
  affinity: number,
) => {
  const capped = expertSkillMaxLevel(skill, affinity);
  let level = 0;
  while (
    level < capped &&
    (skill.unlockAffinityLevel === undefined ||
      affinityNeededForSkillLevel(skill, level + 1) <= affinity)
  ) {
    level += 1;
  }
  return level;
};

/**
 * The lowest affinity level, above `affinity`, at which a skill can reach `level`. It is null when
 * the data states no such level, so the skill has no known cap to wait for.
 */
export const affinityForSkillLevel = (
  skill: ExpertSkill,
  affinity: number,
  level: number,
) => {
  for (
    let step = AFFINITY_STEP * (Math.floor(affinity / AFFINITY_STEP) + 1);
    step <= MAX_AFFINITY;
    step += AFFINITY_STEP
  ) {
    if (skillMaxLevelAtAffinity(skill, step) >= level) return step;
  }
  return null;
};
