import { activeTimeZone } from "@/i18n/formatter";
import { zonedDayStartMs, zonedParts } from "@/i18n/zones";
import type {
  UserEventRepeat,
  UserEventRun,
  UserEventRunUnit,
  UserEventState,
} from "@/types/app";
import type { GameEvent } from "@/data/game/gameEvents";

export type EventsZone = "utc" | "local";

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;
const MAX_STEPS = 400;
const MAX_OCCURRED = 60;

const UNIT_MS: Record<UserEventRunUnit, number> = {
  minutes: MINUTE_MS,
  hours: HOUR_MS,
  days: DAY_MS,
  weeks: 7 * DAY_MS,
  months: 30 * DAY_MS,
};

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const WEEKDAY_IDS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export interface RunInstance {
  runIndex: number;
  label?: string;
  startMs: number;
  endMs: number;
}

export interface ZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export const runLengthMs = (run: Pick<UserEventRun, "length" | "unit">) =>
  run.length * UNIT_MS[run.unit];

const addMonthsUtc = (ms: number, months: number) => {
  const date = new Date(ms);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
};

export const nextStartMs = (
  startMs: number,
  repeat: UserEventRepeat,
): number | null => {
  if (repeat.kind === "weekly") {
    const wanted = new Set(
      (repeat.weekdays ?? []).map((name) => WEEKDAY_INDEX[name]),
    );
    if (wanted.size === 0) return startMs + 7 * DAY_MS;
    for (let step = 1; step <= 7; step++) {
      const candidate = startMs + step * DAY_MS;
      if (wanted.has(new Date(candidate).getUTCDay())) return candidate;
    }
    return null;
  }
  if (repeat.kind !== "every" || !repeat.every || repeat.every <= 0)
    return null;
  if (repeat.unit === "months") return addMonthsUtc(startMs, repeat.every);
  if (!repeat.unit) return null;
  return startMs + repeat.every * UNIT_MS[repeat.unit];
};

const occurredKey = (entry: { runIndex: number; startsAt: string }) =>
  `${entry.runIndex}|${entry.startsAt}`;

/**
 * Moves the start of every run whose end has passed forward by the repeat rule and keeps the
 * ended runs in `occurred`. The function is pure, so a view can call it while rendering.
 */
export const rollForward = (
  state: UserEventState,
  nowMs: number,
): UserEventState => {
  const occurred = [...(state.occurred ?? [])];
  const known = new Set(occurred.map(occurredKey));
  const runs = state.runs.map((run, runIndex) => {
    let startMs = Date.parse(run.startsAt);
    for (let step = 0; step < MAX_STEPS; step++) {
      if (startMs + runLengthMs(run) > nowMs) break;
      const next = nextStartMs(startMs, state.repeat);
      if (next === null) break;
      const entry = { runIndex, startsAt: new Date(startMs).toISOString() };
      if (!known.has(occurredKey(entry))) {
        known.add(occurredKey(entry));
        occurred.push(entry);
      }
      startMs = next;
    }
    return { ...run, startsAt: new Date(startMs).toISOString() };
  });
  occurred.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return { ...state, runs, occurred: occurred.slice(-MAX_OCCURRED) };
};

export const hasEnded = (state: UserEventState, nowMs: number) =>
  state.repeat.kind === "none" &&
  state.runs.every(
    (run) => Date.parse(run.startsAt) + runLengthMs(run) <= nowMs,
  );

const instanceOf = (
  state: UserEventState,
  runIndex: number,
  startMs: number,
): RunInstance => {
  const run = state.runs[runIndex];
  return {
    runIndex,
    label: run.label,
    startMs,
    endMs: startMs + runLengthMs(run),
  };
};

const occurredInstances = (rolled: UserEventState): RunInstance[] =>
  (rolled.occurred ?? [])
    .filter((entry) => rolled.runs[entry.runIndex] !== undefined)
    .map((entry) =>
      instanceOf(rolled, entry.runIndex, Date.parse(entry.startsAt)),
    );

/** Runs from the saved start on, that end after `fromMs` and start before `toMs`. */
const forwardInstances = (
  rolled: UserEventState,
  fromMs: number,
  toMs: number,
): RunInstance[] => {
  const found: RunInstance[] = [];
  rolled.runs.forEach((run, runIndex) => {
    let startMs: number | null = Date.parse(run.startsAt);
    for (let step = 0; step < MAX_STEPS && startMs !== null; step++) {
      if (startMs >= toMs) break;
      const instance = instanceOf(rolled, runIndex, startMs);
      if (instance.endMs > fromMs) found.push(instance);
      startMs = nextStartMs(startMs, rolled.repeat);
    }
  });
  return found;
};

/** Every run, ended or coming, that overlaps the window. */
export const instancesBetween = (
  state: UserEventState,
  nowMs: number,
  fromMs: number,
  toMs: number,
): RunInstance[] => {
  const rolled = rollForward(state, nowMs);
  const past = occurredInstances(rolled).filter(
    (instance) => instance.endMs > fromMs && instance.startMs < toMs,
  );
  return [...past, ...forwardInstances(rolled, fromMs, toMs)].sort(
    (a, b) => a.startMs - b.startMs,
  );
};

/** Runs that are on now or start before `untilMs`. */
export const upcomingInstances = (
  state: UserEventState,
  nowMs: number,
  untilMs: number,
): RunInstance[] =>
  forwardInstances(rollForward(state, nowMs), nowMs, untilMs).sort(
    (a, b) => a.startMs - b.startMs,
  );

/** Runs that ended, newest first. */
export const endedInstances = (
  state: UserEventState,
  nowMs: number,
): RunInstance[] => {
  const rolled = rollForward(state, nowMs);
  const settled = rolled.runs
    .map((_, runIndex) =>
      instanceOf(rolled, runIndex, Date.parse(rolled.runs[runIndex].startsAt)),
    )
    .filter((instance) => instance.endMs <= nowMs);
  return [...occurredInstances(rolled), ...settled].sort(
    (a, b) => b.startMs - a.startMs,
  );
};

export const zoneParts = (ms: number, zone: EventsZone): ZoneParts => {
  const date = new Date(ms);
  if (zone === "utc") {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      weekday: date.getUTCDay(),
    };
  }
  return zonedParts(ms, activeTimeZone());
};

export const zoneDayStartMs = (
  year: number,
  month: number,
  day: number,
  zone: EventsZone,
) =>
  zone === "utc"
    ? Date.UTC(year, month, day)
    : zonedDayStartMs(year, month, day, activeTimeZone());

/** The calendar day of a moment as a whole number of days, so two days compare in any zone. */
export const dayNumberOf = (ms: number, zone: EventsZone) => {
  const parts = zoneParts(ms, zone);
  return Math.round(Date.UTC(parts.year, parts.month, parts.day) / DAY_MS);
};

export const clockText = (ms: number, zone: EventsZone) => {
  const parts = zoneParts(ms, zone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

export interface CalendarDay {
  key: string;
  year: number;
  month: number;
  day: number;
  inMonth: boolean;
  startMs: number;
  endMs: number;
}

/** The weeks of a month, Sunday first, filled with days of the month before and after. */
export const monthGrid = (
  year: number,
  month: number,
  zone: EventsZone,
): CalendarDay[] => {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - firstWeekday + index));
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    return {
      key: `${y}-${m}-${d}`,
      year: y,
      month: m,
      day: d,
      inMonth: m === month,
      startMs: zoneDayStartMs(y, m, d, zone),
      endMs: zoneDayStartMs(y, m, d + 1, zone),
    };
  });
};

export const isDayLong = (instance: RunInstance) =>
  instance.endMs - instance.startMs >= DAY_MS;

export const msFromDateTime = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00Z`);

export const dateInputOf = (ms: number) =>
  new Date(ms).toISOString().slice(0, 10);

export const timeInputOf = (ms: number) =>
  new Date(ms).toISOString().slice(11, 16);

const startOfUtcDayMs = (ms: number) => Math.floor(ms / DAY_MS) * DAY_MS;

const weekdayOnOrAfter = (fromMs: number, weekday: number) => {
  const gap = (weekday - new Date(fromMs).getUTCDay() + 7) % 7;
  return fromMs + gap * DAY_MS;
};

const clockMs = (time: string | undefined) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * HOUR_MS + minutes * MINUTE_MS;
};

export const suggestedRepeat = (
  event: GameEvent,
): UserEventRepeat | undefined => {
  const repeat = event.schedule?.repeat;
  if (!repeat) return undefined;
  return {
    kind: repeat.kind,
    every: repeat.every,
    unit: repeat.unit,
    weekdays: repeat.weekdays,
  };
};

/** The runs of a new event: the package runs (at most two) set from the day after `nowMs`. */
export const suggestedRuns = (
  event: GameEvent,
  nowMs: number,
): UserEventRun[] => {
  const tomorrow = startOfUtcDayMs(nowMs) + DAY_MS;
  const source = (event.schedule?.runs ?? []).slice(0, 2);
  if (source.length === 0) {
    return [
      {
        startsAt: new Date(tomorrow).toISOString(),
        length: 1,
        unit: "days",
      },
    ];
  }
  const runs: UserEventRun[] = [];
  source.forEach((run, index) => {
    const previous = runs[index - 1];
    const earliest = previous
      ? startOfUtcDayMs(Date.parse(previous.startsAt))
      : tomorrow;
    const dayMs = run.startWeekday
      ? weekdayOnOrAfter(earliest, WEEKDAY_INDEX[run.startWeekday])
      : previous
        ? earliest + runLengthMs(previous)
        : tomorrow;
    runs.push({
      label: run.label,
      startsAt: new Date(dayMs + clockMs(run.startTimeUtc)).toISOString(),
      length: run.length,
      unit: run.unit,
    });
  });
  return runs;
};

export const withRolledEvents = (
  states: UserEventState[] | undefined,
  nowMs: number,
) => (states ?? []).map((state) => rollForward(state, nowMs));
