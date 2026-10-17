import { calculateExperts, EXPERT_MAX_LEVEL } from "whiteout-survival-data";
import type {
  Expert,
  ExpertCalculation,
  ExpertEventPoints,
  ExpertGoal,
  ExpertItemResult,
} from "whiteout-survival-data";
import type { CoreEventId } from "@/types/app";
import { gameEventOf } from "./coreEvents";

export { calculateExperts, EXPERT_MAX_LEVEL };
export type { Expert, ExpertCalculation, ExpertGoal, ExpertItemResult };
export { allExperts, BOOK_ITEM_ID, sigilItemIdOf } from "./experts";

export type ExpertEventId = keyof ExpertEventPoints;

export const EXPERT_EVENT_IDS: ExpertEventId[] = ["svs", "allianceShowdown"];

const coreEventIdOf: Record<ExpertEventId, CoreEventId> = {
  svs: "svs",
  allianceShowdown: "showdown",
};

export const expertEventName = (id: ExpertEventId) =>
  gameEventOf(coreEventIdOf[id]).name;

export const isAdvancementLevel = (expert: Expert, level: number) =>
  expert.affinityLevels[level - 1].advancementCost !== undefined;
