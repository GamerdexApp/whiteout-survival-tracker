import {
  EXPERT_LEARNING_QUEUE_OPTIONS,
  EXPERT_MAX_LEVEL,
  EXPERT_SKILL_EXP_PER_LEARNING_MINUTE,
  expertRelationships,
  experts,
  items,
  unreleasedExperts,
} from "whiteout-survival-data";
import type {
  Expert,
  ExpertRelationship,
  ExpertSkill,
} from "whiteout-survival-data";

export const allExperts: Expert[] = experts().get();

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
