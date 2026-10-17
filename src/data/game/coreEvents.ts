import {
  eventRankingTables,
  events,
  SVS_BATTLE_DAY_ID,
} from "whiteout-survival-data";
import type { GameEvent } from "whiteout-survival-data";
import type { CoreEventId } from "@/types/app";

export { SVS_BATTLE_DAY_ID };

export const CORE_EVENT_IDS: CoreEventId[] = [
  "svs",
  "showdown",
  "king",
  "hall",
];

export const gameEventIdOf: Record<CoreEventId, string> = {
  svs: "svs-state-of-power",
  showdown: "alliance-showdown",
  king: "king-of-icefield",
  hall: "hall-of-chief",
};

export const gameEventOf = (id: CoreEventId): GameEvent =>
  events().find(gameEventIdOf[id]) as GameEvent;

export const rankingTablesOf = (id: CoreEventId) =>
  eventRankingTables(gameEventOf(id));

/** The Expert ids and skill names that give a point bonus. */
export const VALERIA_ID = "valeria";
export const VALERIA_SKILL = "Well Prepared";
export const BALDUR_ID = "baldur";
export const BALDUR_SKILL = "Dawn Hymn";

/** The Hall of Chief season shown until the account setting exists. */
export const DEFAULT_HALL_SEASON = 1;

export const MS_PER_DAY = 86_400_000;
