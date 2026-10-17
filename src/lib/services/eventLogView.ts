import { formatCalendarDate } from "@/lib/format";
import { MS_PER_DAY } from "@/data/game/coreEvents";

/** Formats a typed date (YYYY-MM-DD) so the day never shifts in any time zone. */
export const formatTypedDate = formatCalendarDate;

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
