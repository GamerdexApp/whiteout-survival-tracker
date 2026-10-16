import type { CoreEventId } from "./index";

/** Times each action was done, by day id (or stage id) and then by the exact action text. */
export type EventUsage = Record<string, Record<string, number>>;

export interface EventDayResultState {
  score?: number;
  rank?: number;
  allianceRank?: number;
  locked?: boolean;
}

export interface EventOverallState {
  rank?: number;
  allianceRank?: number;
  locked?: boolean;
}

export interface EventLogState {
  /** Typed by the chief as YYYY-MM-DD. The package gives only a rough event length. */
  start?: string;
  end?: string;
  days?: Record<string, EventDayResultState>;
  overall?: EventOverallState;
}

/** One upgrade of a plan exported to an event. The history keeps a copy. */
export interface PlannedUpgrade {
  /** `buildings`, `research` or `chiefGear`. Only these pages plan upgrades with levels. */
  page: string;
  /** The display name, such as Furnace or a research node name. */
  item: string;
  /** The stable id: the building id, the research node id or the chief gear slot id. */
  itemId: string;
  /** Level values as the page saves them: a building level label, a research level number as text, a chief gear level id. */
  from: string | null;
  to: string;
  day: string;
  cost: { itemId: string; amount: number }[];
  power: number;
}

export interface EventHistoryEntry {
  id: string;
  start?: string;
  end?: string;
  endedAt: string;
  days: Record<string, EventDayResultState>;
  overall: EventOverallState;
  totalScore: number;
  /** The planned total of each day when the event ended. */
  plan: Record<string, number>;
  upgrades: PlannedUpgrade[];
}

export interface EventChecklistState {
  [dayIdOrCastle: string]: Record<string, boolean>;
}

export interface CoreEventState {
  usage?: EventUsage;
  log?: EventLogState;
  history?: EventHistoryEntry[];
  /** Checked actions by day id. The key `castle` holds the signed up days. */
  checklist?: EventChecklistState;
}

/** What a page exported to an event: counts by day and action, and the upgrades behind them. */
export interface CoreEventImport {
  event: CoreEventId;
  savedAt: string;
  counts: EventUsage;
  upgrades?: PlannedUpgrade[];
}

export interface CoreEventsImports {
  imports?: Record<string, CoreEventImport>;
}
