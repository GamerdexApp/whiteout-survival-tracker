import { translator } from "@/i18n/formatter";
import type { BeastPlanState, BeastRunState, Playthrough } from "@/types/app";
import {
  calculateBeasts,
  ENDURANCE_TRAINING,
  ENDURANCE_TRAINING_LEVELS,
  GINA_ID,
  rowPaysBeastLevel,
  rowPaysPolarTerror,
  STAMINA_CAN_ITEM_ID,
} from "@/data/game/beasts";
import type { BeastCalculation } from "@/data/game/beasts";
import type { ExportSpec } from "./eventExport";
import { ownedCount } from "./inventory";

export type BeastPlanDraft = Omit<BeastPlanState, "savedAt">;

export const MAX_BEAST_COUNT = 99_999_999;

const emptyPlan: BeastPlanDraft = {
  stamina: 0,
  beastLevel: 1,
  beastRuns: [],
  polarTerrors: 0,
  leftover: "beasts",
};

/** Gina's Endurance Training level of the chief, or undefined when Gina is not owned. */
const ginaSkillLevelOf = (chief: Playthrough) => {
  const gina = chief.heroes?.[GINA_ID];
  return gina?.owned ? gina.skills?.[ENDURANCE_TRAINING] : undefined;
};

export const initialBeastPlan = (chief: Playthrough): BeastPlanDraft => {
  const saved = chief.beastPlan;
  if (saved) {
    return {
      stamina: saved.stamina,
      beastLevel: saved.beastLevel,
      beastRuns: saved.beastRuns,
      polarTerrors: saved.polarTerrors,
      ginaSkillLevel: saved.ginaSkillLevel,
      leftover: saved.leftover,
    };
  }
  return { ...emptyPlan, ginaSkillLevel: ginaSkillLevelOf(chief) };
};

export const withSavedBeastPlan = (
  chief: Playthrough,
  plan: BeastPlanDraft,
  savedAt: string,
): Playthrough => ({ ...chief, beastPlan: { ...plan, savedAt } });

export const staminaCansOf = (chief: Playthrough) =>
  ownedCount(chief, STAMINA_CAN_ITEM_ID);

export const runBeastPlan = (
  plan: BeastPlanDraft,
  chief: Playthrough,
): BeastCalculation =>
  calculateBeasts({
    stamina: plan.stamina,
    staminaCans: staminaCansOf(chief),
    beastLevel: plan.beastLevel,
    beastRuns: plan.beastRuns,
    polarTerrors: plan.polarTerrors,
    ginaSkillLevel: plan.ginaSkillLevel,
  });

export const ginaLevelOptions = Array.from(
  { length: ENDURANCE_TRAINING_LEVELS },
  (_, index) => index + 1,
);

export const withRunChanged = (
  plan: BeastPlanDraft,
  index: number,
  run: BeastRunState,
): BeastPlanDraft => ({
  ...plan,
  beastRuns: plan.beastRuns.map((current, i) => (i === index ? run : current)),
});

export const withRunAdded = (plan: BeastPlanDraft): BeastPlanDraft => ({
  ...plan,
  beastRuns: [...plan.beastRuns, { level: plan.beastLevel, count: 1 }],
});

export const withRunRemoved = (
  plan: BeastPlanDraft,
  index: number,
): BeastPlanDraft => ({
  ...plan,
  beastRuns: plan.beastRuns.filter((_, i) => i !== index),
});

/** The points of the plan in State of Power, with the stamina left spent as the plan says. */
export const totalPointsOf = (
  plan: BeastPlanDraft,
  event: BeastCalculation["events"][number],
) => (plan.leftover === "beasts" ? event.beastPoints : event.polarTerrorPoints);

export const beastPlanScores = (
  plan: BeastPlanDraft,
  result: BeastCalculation,
) => result.events.some((event) => totalPointsOf(plan, event) > 0);

export const exportSpecOf = (
  plan: BeastPlanDraft,
  result: BeastCalculation,
): ExportSpec => {
  const t = translator("coreEvents");
  const leftoverBeasts = plan.leftover === "beasts" ? result.beasts.count : 0;
  const leftoverPolarTerrors =
    plan.leftover === "polarTerrors" ? result.polarTerrors.count : 0;

  return {
    page: "beasts",
    groups: [
      {
        id: "hunts",
        lines: [
          ...plan.beastRuns.map((run, index) => ({
            id: `run-${index}`,
            label: t("beasts.export.beasts", { level: String(run.level) }),
            units: run.count,
            matches: (_event: string, action: string) =>
              rowPaysBeastLevel(action, run.level),
          })),
          {
            id: "leftoverBeasts",
            label: t("beasts.export.leftoverBeasts", {
              level: String(plan.beastLevel),
            }),
            units: leftoverBeasts,
            matches: (_event: string, action: string) =>
              rowPaysBeastLevel(action, plan.beastLevel),
          },
          {
            id: "polarTerrors",
            label: t("beasts.export.polarTerrors"),
            units: plan.polarTerrors + leftoverPolarTerrors,
            matches: (_event: string, action: string) =>
              rowPaysPolarTerror(action),
          },
        ].filter((line) => line.units > 0),
      },
    ],
  };
};
