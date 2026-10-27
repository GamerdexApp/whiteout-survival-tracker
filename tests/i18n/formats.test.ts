import { NUMBER_FORMATS, numberTagOf } from "@/i18n/formats";
import type { NumberFormatId } from "@/i18n/formats";
import {
  configureI18n,
  formatCompact,
  formatDecimal,
  formatNumber,
  translator,
} from "@/i18n/formatter";
import {
  DEFAULT_LOCALE,
  directionOf,
  isSupportedLocale,
  loadMessages,
  REGION_TAG,
  SUPPORTED_LOCALES,
} from "@/i18n/locales";
import type { Locale } from "@/i18n/locales";
import en from "@/i18n/messages/en";
import { afterEach, describe, expect, it } from "vitest";

const use = (locale: Locale, numberFormat: NumberFormatId = "auto") =>
  configureI18n({ locale, messages: en, numberFormat, dateFormat: "auto" });

afterEach(() => use(DEFAULT_LOCALE));

describe("languages", () => {
  it("offers English and 18 other languages, with a region tag for each", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(19);
    expect(SUPPORTED_LOCALES[0]).toBe("en");
    expect(Object.keys(REGION_TAG).sort()).toEqual(
      [...SUPPORTED_LOCALES].sort(),
    );
  });

  it("recognises a supported language and nothing else", () => {
    expect(isSupportedLocale("de")).toBe(true);
    expect(isSupportedLocale("xx")).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });

  it("writes Arabic right to left and the rest left to right", () => {
    expect(directionOf("ar")).toBe("rtl");
    expect(directionOf("en")).toBe("ltr");
    expect(directionOf("ja")).toBe("ltr");
  });

  it("fills a language with the English message where it has none", async () => {
    const german = await loadMessages("de");

    expect(Object.keys(german)).toEqual(Object.keys(en));
    expect(await loadMessages("en")).toBe(en);
  });
});

describe("number formats", () => {
  it("follows the language on auto and the region of the format otherwise", () => {
    expect(numberTagOf("auto", "de")).toBe(REGION_TAG.de);
    expect(numberTagOf("indian", "en")).toBe("en-IN");
    expect(NUMBER_FORMATS.map((format) => format.id)).toContain("swiss");
  });

  it("separates thousands the way the chosen format does", () => {
    use("en", "us");
    expect(formatNumber(1234567)).toBe("1,234,567");
    use("en", "european");
    expect(formatNumber(1234567)).toBe("1.234.567");
    use("en", "indian");
    expect(formatNumber(1234567)).toBe("12,34,567");
  });

  it("limits the decimals and shortens big counts", () => {
    use("en", "us");

    expect(formatDecimal(0.546612, 4)).toBe("0.5466");
    expect(formatDecimal(12.5)).toBe("12.5");
    expect(formatCompact(4_200_000)).toBe("4.2M");
    expect(formatCompact(950)).toBe("950");
  });
});

describe("translator", () => {
  it("fills the variables of an English message", () => {
    const t = translator("resources");

    expect(t("core.level", { level: 3 })).toBe("Lv. 3");
  });
});
