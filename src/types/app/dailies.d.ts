export interface DailyTaskState {
  id: string;
  label: string;
  /** The id of the starter task this one came from. */
  presetId?: string;
}

export interface DailyMissionState {
  level: number;
  /** The reset cycle date (YYYY-MM-DD) in which the level was set. */
  cycleDate: string;
}

export interface DailiesState {
  /** Time of day of the reset in UTC, as HH:MM. */
  resetTimeUtc: string;
  presetVersion: number;
  tasks: DailyTaskState[];
  /** The cycle date on which each task was last done. A task is done today when it equals today's cycle. */
  done: Record<string, string>;
  missions?: Record<string, DailyMissionState>;
}
