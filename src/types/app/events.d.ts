export type UserEventRepeatKind = "none" | "every" | "weekly";
export type UserEventUnit = "hours" | "days" | "weeks" | "months";
export type UserEventGives = "rewards" | "personal" | "alliance" | "both";

export interface UserEventRepeat {
  kind: UserEventRepeatKind;
  every?: number;
  unit?: UserEventUnit;
  weekdays?: string[];
}

export type UserEventRunUnit = "minutes" | UserEventUnit;

export interface UserEventRun {
  label?: string;
  /** UTC date and time as an ISO string. */
  startsAt: string;
  length: number;
  unit: UserEventRunUnit;
}

export interface UserEventState {
  eventId: string;
  repeat: UserEventRepeat;
  runs: UserEventRun[];
  gives: UserEventGives;
  /** Runs that ended. A passed run moves forward by the repeat rule and stays here. */
  occurred?: { runIndex: number; startsAt: string }[];
}

export interface EventResultState {
  id: string;
  eventId: string;
  runStart: string;
  tookPart: boolean;
  score?: number;
  rank?: number;
  allianceRank?: number;
  /** The version name from the package, for events that have versions. */
  version?: string;
  tier?: string;
  placement?: string;
  difficulty?: string;
  waves?: number;
  personalPoints?: number;
  alliancePoints?: number;
  rewards?: { itemId?: string; name: string; amount?: number }[];
  notes?: string;
  /** Names of the targets the chief reached, from the package. */
  reached?: string[];
  /** Alliance result of a tier event run. */
  outcome?: "won" | "lost" | "drawn";
}
