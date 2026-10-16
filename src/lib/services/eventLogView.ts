import { formatShortDate } from "@/lib/format";
import { MS_PER_DAY } from "@/data/game/coreEvents";

const localDateOf = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

/** Formats a typed date (YYYY-MM-DD) in the local calendar, so the day never shifts. */
export const formatTypedDate = (day: string) =>
  formatShortDate(localDateOf(day).toISOString());

/** The number of days from start to end, both included. Null when a date is missing or the end is earlier. */
export const dayCountOf = (
  start: string | undefined,
  end: string | undefined,
) => {
  if (!start || !end) return null;
  const days =
    Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY) + 1;
  return days >= 1 ? days : null;
};

export const hasEndedBeforeStart = (
  start: string | undefined,
  end: string | undefined,
) => Boolean(start && end && end < start);
