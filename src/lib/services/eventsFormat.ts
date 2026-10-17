import { translator } from "@/i18n/formatter";
import type { UserEventRun } from "@/types/app";
import { formatCalendarDate, formatNumber, formatTime } from "@/lib/format";
import { clockText, WEEKDAY_IDS, zoneParts } from "./eventsSchedule";
import type { EventsZone } from "./eventsSchedule";

export const MONTH_IDS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export const shortDayText = (ms: number, zone: EventsZone) => {
  const { year, month, day } = zoneParts(ms, zone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return formatCalendarDate(`${year}-${pad(month + 1)}-${pad(day)}`);
};

export const weekdayDayText = (ms: number, zone: EventsZone) =>
  translator("events")("format.weekdayDay", {
    weekday: translator("events")(
      `weekdays.short.${WEEKDAY_IDS[zoneParts(ms, zone).weekday]}`,
    ),
    date: shortDayText(ms, zone),
  });

export const timeText = (ms: number, zone: EventsZone) =>
  zone === "utc"
    ? translator("events")("format.utcTime", { time: clockText(ms, zone) })
    : formatTime(new Date(ms));

export const dateTimeText = (ms: number, zone: EventsZone) =>
  translator("events")("format.dateTime", {
    date: shortDayText(ms, zone),
    time: timeText(ms, zone),
  });

export const lengthText = (run: Pick<UserEventRun, "length" | "unit">) =>
  translator("events")(`format.length.${run.unit}`, {
    count: run.length,
    amount: formatNumber(run.length),
  });

export const rangeText = (startMs: number, endMs: number, zone: EventsZone) =>
  translator("events")("format.range", {
    start: shortDayText(startMs, zone),
    end: shortDayText(endMs - 1, zone),
  });

export const monthTitleText = (year: number, month: number) =>
  translator("events")("calendar.monthTitle", {
    month: translator("events")(`months.${MONTH_IDS[month]}`),
    year: String(year),
  });
