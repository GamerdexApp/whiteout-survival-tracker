import {
  allExperts,
  calculateExperts,
  EXPERT_EVENT_IDS,
  expertEventName,
  isAdvancementLevel,
  sigilItemIdOf,
} from "@/data/game/calcExpert";
import type {
  Expert,
  ExpertCalculation,
  ExpertEventId,
  ExpertGoal,
} from "@/data/game/calcExpert";

export interface LevelRange {
  current: number;
  goal: number;
}

export interface AffinityRange extends LevelRange {
  currentAdvanced: boolean;
  goalAdvanced: boolean;
}

export interface ExpertDraft {
  expert: Expert;
  level: AffinityRange;
  skills: LevelRange[];
}

export const newExpertDraft = (expert: Expert): ExpertDraft => ({
  expert,
  level: { current: 1, goal: 1, currentAdvanced: false, goalAdvanced: false },
  skills: expert.skills.map(() => ({ current: 1, goal: 1 })),
});

export const expertsNotIn = (drafts: ExpertDraft[]) =>
  allExperts.filter(
    (expert) => !drafts.some((draft) => draft.expert.id === expert.id),
  );

export const levelsFrom = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, index) => min + index);

/** A goal at the current level adds nothing when the expert has advanced there already. */
export const canAdvanceAtGoal = (expert: Expert, level: AffinityRange) =>
  isAdvancementLevel(expert, level.goal) &&
  !(level.goal === level.current && level.currentAdvanced);

const withAdvancementFlags = (
  expert: Expert,
  level: AffinityRange,
): AffinityRange => {
  const currentAdvanced =
    level.currentAdvanced && isAdvancementLevel(expert, level.current);
  const ranged = { ...level, currentAdvanced };
  return {
    ...ranged,
    goalAdvanced: ranged.goalAdvanced && canAdvanceAtGoal(expert, ranged),
  };
};

export const withAffinityCurrent = (
  draft: ExpertDraft,
  current: number,
): ExpertDraft => ({
  ...draft,
  level: withAdvancementFlags(draft.expert, {
    ...draft.level,
    current,
    goal: Math.max(draft.level.goal, current),
  }),
});

export const withAffinityGoal = (
  draft: ExpertDraft,
  goal: number,
): ExpertDraft => ({
  ...draft,
  level: withAdvancementFlags(draft.expert, { ...draft.level, goal }),
});

export const withAdvanced = (
  draft: ExpertDraft,
  flag: "currentAdvanced" | "goalAdvanced",
  advanced: boolean,
): ExpertDraft => ({
  ...draft,
  level: withAdvancementFlags(draft.expert, {
    ...draft.level,
    [flag]: advanced,
  }),
});

export const withSkillCurrent = (
  draft: ExpertDraft,
  index: number,
  current: number,
): ExpertDraft => ({
  ...draft,
  skills: draft.skills.map((range, position) =>
    position === index
      ? { current, goal: Math.max(range.goal, current) }
      : range,
  ),
});

export const withSkillGoal = (
  draft: ExpertDraft,
  index: number,
  goal: number,
): ExpertDraft => ({
  ...draft,
  skills: draft.skills.map((range, position) =>
    position === index ? { ...range, goal } : range,
  ),
});

const goalOf = (draft: ExpertDraft): ExpertGoal => ({
  id: draft.expert.id,
  level: draft.level,
  skills: draft.expert.skills.map((skill, index) => ({
    name: skill.name,
    ...draft.skills[index],
  })),
});

export const runExpertCalculator = (drafts: ExpertDraft[]) =>
  calculateExperts(drafts.map(goalOf));

export interface SigilNeed {
  expertId: string;
  itemId: string | null;
  amount: number;
}

export const sigilNeedsOf = (result: ExpertCalculation): SigilNeed[] =>
  result.items
    .filter((item) => item.sigils > 0)
    .map((item) => ({
      expertId: item.id,
      itemId: sigilItemIdOf(item.id),
      amount: item.sigils,
    }));

export interface ExpertEventPointsRow {
  id: ExpertEventId;
  name: string;
  itemPoints: number;
  pointsPerSpeedupMinute: number;
  speedupPoints: number;
  total: number;
}

/** Speedup points assume that Learning or General Speedups cover the whole learning time. */
export const eventPointRowsOf = (
  result: ExpertCalculation,
): ExpertEventPointsRow[] =>
  EXPERT_EVENT_IDS.map((id) => {
    const itemPoints = result.eventPoints[id];
    const pointsPerSpeedupMinute = result.speedupPointsPerMinute[id];
    const speedupPoints = pointsPerSpeedupMinute * result.learningMinutes;
    return {
      id,
      name: expertEventName(id),
      itemPoints,
      pointsPerSpeedupMinute,
      speedupPoints,
      total: itemPoints + speedupPoints,
    };
  });

export const hasProgress = (item: {
  levels: number;
  advancements: number;
  skillLevels: number;
}) => item.levels > 0 || item.advancements > 0 || item.skillLevels > 0;
