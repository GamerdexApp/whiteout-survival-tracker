export const AUTOMATIC_TIME_ZONE = "auto";

export const deviceTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const isTimeZoneId = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** The time zone ids the browser knows, with UTC first because the game runs on it. */
export const supportedTimeZones = () => {
  const known = Intl.supportedValuesOf("timeZone").filter((id) => id !== "UTC");
  return ["UTC", ...known];
};

export interface ZonedParts {
  year: number;
  /** Zero based, like `Date`. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Zero is Sunday, like `Date`. */
  weekday: number;
}

const partFormatters = new Map<string, Intl.DateTimeFormat>();

const partFormatterOf = (timeZone: string) => {
  const known = partFormatters.get(timeZone);
  if (known) return known;
  const created = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
  partFormatters.set(timeZone, created);
  return created;
};

/** The calendar date and clock time of a moment in a time zone. */
export const zonedParts = (ms: number, timeZone: string): ZonedParts => {
  const parts = Object.fromEntries(
    partFormatterOf(timeZone)
      .formatToParts(new Date(ms))
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month - 1,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    weekday: new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day),
    ).getUTCDay(),
  };
};

const MINUTE_MS = 60_000;

/** How far the time zone clock is ahead of UTC at a moment, in milliseconds. */
const offsetMsAt = (ms: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
  return asUtc - Math.floor(ms / MINUTE_MS) * MINUTE_MS;
};

/** The moment a calendar day starts in a time zone. A day may be 23 or 25 hours long. */
export const zonedDayStartMs = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
) => {
  const wallClock = Date.UTC(year, month, day);
  const first = wallClock - offsetMsAt(wallClock, timeZone);
  return wallClock - offsetMsAt(first, timeZone);
};

const pad = (value: number) => String(value).padStart(2, "0");

/** The calendar date of a moment in a time zone, written YYYY-MM-DD. */
export const zonedDateOf = (ms: number, timeZone: string) => {
  const p = zonedParts(ms, timeZone);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
};
