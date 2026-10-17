import type {
  EventCategory,
  GameEvent,
  GameEventResultShape,
  GameEventReward,
} from "whiteout-survival-data";
import { allGameEvents, EVENT_CATEGORIES } from "@/data/game/gameEvents";

export type EventCategoryFilter = EventCategory | "all";
export type ScoringFilter = GameEventResultShape | "any";

export const SCORING_FILTER_IDS: ScoringFilter[] = [
  "any",
  "ranking",
  "tier",
  "milestones",
  "waves",
  "participation",
];

export type ScoringPartKind =
  "days" | "tiers" | "missions" | "waves" | "versions" | "levels";

export interface ScoringPart {
  kind: ScoringPartKind;
  count: number;
}

export const scoringParts = (event: GameEvent): ScoringPart[] => {
  const parts: ScoringPart[] = [
    { kind: "days", count: event.days?.length ?? 0 },
    { kind: "tiers", count: event.tiers?.length ?? 0 },
    { kind: "missions", count: event.missions?.length ?? 0 },
    { kind: "waves", count: event.waves?.length ?? 0 },
    { kind: "versions", count: event.versions?.length ?? 0 },
    { kind: "levels", count: event.pointLevels?.levels.length ?? 0 },
  ];
  return parts.filter((part) => part.count > 0);
};

export const categoryCounts = () =>
  EVENT_CATEGORIES.map((category) => ({
    category,
    count: allGameEvents().filter((event) => event.category === category)
      .length,
  }));

export const filterEvents = (
  query: string,
  category: EventCategoryFilter,
  scoring: ScoringFilter,
) => {
  const needle = query.trim().toLowerCase();
  return allGameEvents().filter((event) => {
    if (category !== "all" && event.category !== category) return false;
    if (scoring !== "any" && event.resultShape !== scoring) return false;
    return !needle || event.name.toLowerCase().includes(needle);
  });
};

const CUT_OFF_NOTE = /cut off/i;

/** The package marks a partial reward list with a note that says the source cuts it off. */
export const isPartialNote = (note: string | undefined) =>
  note !== undefined && CUT_OFF_NOTE.test(note);

export const isPartialRewardList = (rewards: GameEventReward[] | undefined) =>
  rewards?.some((reward) => isPartialNote(reward.note)) ?? false;
