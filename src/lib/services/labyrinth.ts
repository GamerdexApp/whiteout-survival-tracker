import type { Playthrough } from "@/types/app";
import {
  JUSTUS_GLOWSTONE_SKILL,
  JUSTUS_ID,
  LABYRINTH_GLOWSTONE_PER_STAGE,
  labyrinthMilestones,
  labyrinthZones,
} from "@/data/game/labyrinth";
import type { GameEventTier, LabyrinthZone } from "@/data/game/labyrinth";
import { buildExpertViews } from "./experts";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wholeOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

export const stagesClearedOf = (chief: Playthrough, zone: LabyrinthZone) =>
  clamp(wholeOr(chief.labyrinth?.stages?.[zone.id], 0), 0, zone.stages);

/** Read from the Experts page. A level of 0 means Justus is not recruited or the skill is not learned. */
export const justusLevelOf = (chief: Playthrough) => {
  const view = buildExpertViews(chief).find(
    (item) => item.expert.id === JUSTUS_ID,
  );
  if (!view?.recruited) return 0;
  const index = view.expert.skills.findIndex(
    (skill) => skill.name === JUSTUS_GLOWSTONE_SKILL.name,
  );
  return index >= 0 ? view.skillLevels[index] : 0;
};

export const glowstoneBonusPercentAt = (level: number) =>
  JUSTUS_GLOWSTONE_SKILL.bonusPercentByLevel[level - 1] ?? 0;

export const justusBonusOf = (weeklyBase: number, level: number) =>
  Math.floor((weeklyBase * glowstoneBonusPercentAt(level)) / 100);

export const withZoneStages = (
  chief: Playthrough,
  zone: LabyrinthZone,
  stages: number,
): Playthrough => ({
  ...chief,
  labyrinth: {
    ...chief.labyrinth,
    stages: {
      ...chief.labyrinth?.stages,
      [zone.id]: clamp(Math.trunc(stages), 0, zone.stages),
    },
  },
});

export interface ZoneView {
  zone: LabyrinthZone;
  stagesCleared: number;
  glowstonePerWeek: number;
}

export interface MilestoneView {
  milestone: GameEventTier;
  reached: boolean;
}

export interface LabyrinthView {
  zones: ZoneView[];
  /** Each first clear of a stage gives one Labyrinth Core, so this is also the Core count. */
  stagesCleared: number;
  stagesTotal: number;
  justusLevel: number;
  bonusPercent: number;
  weeklyBase: number;
  weeklyBonus: number;
  weeklyTotal: number;
  milestones: MilestoneView[];
}

const buildZoneView = (chief: Playthrough, zone: LabyrinthZone): ZoneView => {
  const stagesCleared = stagesClearedOf(chief, zone);
  return {
    zone,
    stagesCleared,
    glowstonePerWeek: stagesCleared * LABYRINTH_GLOWSTONE_PER_STAGE,
  };
};

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

export const buildLabyrinthView = (chief: Playthrough): LabyrinthView => {
  const zones = labyrinthZones.map((zone) => buildZoneView(chief, zone));
  const stagesCleared = sum(zones.map((view) => view.stagesCleared));
  const justusLevel = justusLevelOf(chief);
  const bonusPercent = glowstoneBonusPercentAt(justusLevel);
  const weeklyBase = sum(zones.map((view) => view.glowstonePerWeek));
  const weeklyBonus = justusBonusOf(weeklyBase, justusLevel);
  return {
    zones,
    stagesCleared,
    stagesTotal: sum(labyrinthZones.map((zone) => zone.stages)),
    justusLevel,
    bonusPercent,
    weeklyBase,
    weeklyBonus,
    weeklyTotal: weeklyBase + weeklyBonus,
    milestones: labyrinthMilestones.map((milestone) => ({
      milestone,
      reached: stagesCleared >= (milestone.scoreTotal ?? Infinity),
    })),
  };
};
