import { eventRankingTables, events } from "whiteout-survival-data";
import type {
  EventCategory,
  EventSchedule,
  GameEvent,
  GameEventRanking,
  GameEventRankingTableView,
  GameEventReward,
  GameEventTier,
} from "whiteout-survival-data";
import { gameEventIdOf } from "./coreEvents";

export type {
  EventCategory,
  EventSchedule,
  GameEvent,
  GameEventRanking,
  GameEventRankingTableView,
  GameEventReward,
  GameEventTier,
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "alliance",
  "solo",
  "rookie",
  "holiday",
];

const CORE_GAME_EVENT_IDS = new Set<string>(Object.values(gameEventIdOf));

export const allGameEvents = (): GameEvent[] => events().get();

export const gameEventById = (id: string): GameEvent | undefined =>
  events().find(id);

export const isCoreGameEvent = (id: string) => CORE_GAME_EVENT_IDS.has(id);

export const rankingTablesOfEvent = (
  event: GameEvent,
): GameEventRankingTableView[] => eventRankingTables(event);
