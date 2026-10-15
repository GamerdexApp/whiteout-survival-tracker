import type en from "./messages/en";

export type Messages = typeof en;

/**
 * Add a language here and add its catalog to `loadMessages`. A language that is not listed here
 * falls back to English, so an old backup with an unknown language still opens.
 */
export const SUPPORTED_LOCALES = ["en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

/**
 * The regional tag that the browser Intl API formats numbers and dates with when the player keeps
 * the Auto choice. A language can have several regions, so this is its default one.
 */
export const REGION_TAG: Record<Locale, string> = {
  en: "en-US",
};

export const loadMessages = async (locale: Locale): Promise<Messages> => {
  switch (locale) {
    case "en":
      return (await import("./messages/en")).default;
  }
};
