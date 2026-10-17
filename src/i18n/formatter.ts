import { createTranslator } from "next-intl";
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_NUMBER_FORMAT,
  numberTagOf,
} from "./formats";
import type { DateFormatId, NumberFormatId } from "./formats";
import { DEFAULT_LOCALE, REGION_TAG } from "./locales";
import type { Locale, Messages } from "./locales";
import en from "./messages/en";
import { deviceTimeZone, zonedDateOf } from "./zones";

/**
 * The language and formats that code outside React reads. `I18nProvider` sets them, and it
 * remounts its children when they change, so a plain function such as `formatNumber` is always
 * current while it renders.
 */
interface I18nState {
  locale: Locale;
  messages: Messages;
  numberFormat: NumberFormatId;
  dateFormat: DateFormatId;
  /** A time zone id, or undefined to follow the device. */
  timeZone?: string;
}

let state: I18nState = {
  locale: DEFAULT_LOCALE,
  messages: en,
  numberFormat: DEFAULT_NUMBER_FORMAT,
  dateFormat: DEFAULT_DATE_FORMAT,
};

export const configureI18n = (next: I18nState) => {
  state = next;
};

export const getI18nState = () => state;

/** The time zone of every date and time the app writes. It follows the device unless chosen. */
export const activeTimeZone = () => state.timeZone ?? deviceTimeZone();

const numberTag = () => numberTagOf(state.numberFormat, state.locale);
const languageTag = () => REGION_TAG[state.locale];

const numberFormatters = new Map<string, Intl.NumberFormat>();

const numberFormatter = (options: Intl.NumberFormatOptions = {}) => {
  const key = `${numberTag()}|${JSON.stringify(options)}`;
  const known = numberFormatters.get(key);
  if (known) return known;

  const created = new Intl.NumberFormat(numberTag(), options);
  numberFormatters.set(key, created);
  return created;
};

export const formatNumber = (value: number) => numberFormatter().format(value);

/**
 * A number with at most `maxFractionDigits` decimals, for example 12.5 or 0.04.
 */
export const formatDecimal = (value: number, maxFractionDigits = 2) =>
  numberFormatter({ maximumFractionDigits: maxFractionDigits }).format(value);

/**
 * Shortens a count for tight rows, for example 4,200,000 becomes 4.2M. Counts below 1,000 stay
 * whole. The unit letters come from the number format, so a language writes them its own way.
 */
export const formatCompact = (value: number) =>
  numberFormatter({ notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );

const DATE_PATTERNS: Record<Exclude<DateFormatId, "auto">, string[]> = {
  mdy: ["month", "day", "year"],
  dmy: ["day", "month", "year"],
  ymd: ["year", "month", "day"],
};

const DATE_SEPARATOR: Record<Exclude<DateFormatId, "auto">, string> = {
  mdy: "/",
  dmy: "/",
  ymd: "-",
};

const numericDate = (
  date: Date,
  format: Exclude<DateFormatId, "auto">,
  timeZone?: string,
) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return DATE_PATTERNS[format]
    .map((type) => parts[type])
    .join(DATE_SEPARATOR[format]);
};

export const formatTime = (date: Date) =>
  date.toLocaleTimeString(languageTag(), {
    timeZone: state.timeZone,
    hour: "numeric",
    minute: "2-digit",
  });

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (state.dateFormat !== "auto") {
    return `${numericDate(date, state.dateFormat, state.timeZone)}, ${formatTime(date)}`;
  }
  return date.toLocaleString(languageTag(), {
    timeZone: state.timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const writeDate = (date: Date, timeZone: string | undefined) => {
  if (state.dateFormat !== "auto") {
    return numericDate(date, state.dateFormat, timeZone);
  }
  return date.toLocaleDateString(languageTag(), {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** The date of a moment, in the chosen time zone. */
export const formatShortDate = (iso: string) =>
  writeDate(new Date(iso), state.timeZone);

/**
 * A calendar date typed as YYYY-MM-DD, such as a server start date. It has no time and no zone,
 * so it prints the same day in every time zone.
 */
export const formatCalendarDate = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return writeDate(new Date(Date.UTC(year, month - 1, date, 12)), "UTC");
};

/** Today as YYYY-MM-DD in the chosen time zone. */
export const todayDate = () => zonedDateOf(Date.now(), activeTimeZone());

/**
 * A translator for code that is not a component, such as a service that builds a sentence. A
 * component uses the `useTranslations` hook instead.
 */
export const translator = <Namespace extends keyof Messages>(
  namespace: Namespace,
) =>
  createTranslator({
    locale: state.locale,
    messages: state.messages,
    namespace,
  });
