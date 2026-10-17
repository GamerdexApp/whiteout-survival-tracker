"use client";

import { DATE_FORMATS, NUMBER_FORMATS, numberTagOf } from "@/i18n/formats";
import type { DateFormatId, NumberFormatId } from "@/i18n/formats";
import { formatDateTime, getI18nState } from "@/i18n/formatter";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/locales";
import {
	AUTOMATIC_TIME_ZONE,
	deviceTimeZone,
	isTimeZoneId,
	supportedTimeZones,
} from "@/i18n/zones";
import { useLocale, useTranslations } from "next-intl";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";
import { SettingsCard } from "./SettingsCard";

const SAMPLE_NUMBER = 1234567.89;
const SAMPLE_DATE = new Date(2026, 9, 8, 14, 5);
const SAMPLE_INSTANT = new Date(Date.UTC(2026, 9, 8, 14, 5)).toISOString();
const timeZones = supportedTimeZones();

const languageName = (locale: Locale) =>
	new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;

const dateExample = (format: DateFormatId, locale: Locale) => {
	if (format === "auto") {
		return SAMPLE_DATE.toLocaleDateString(locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}
	const pattern = { mdy: "MM/DD/YYYY", dmy: "DD/MM/YYYY", ymd: "YYYY-MM-DD" }[format];
	return pattern
		.replace("YYYY", String(SAMPLE_DATE.getFullYear()))
		.replace("MM", "10")
		.replace("DD", "08");
};

export function RegionCard() {
	const t = useTranslations("settings.region");
	const locale = useLocale() as Locale;
	const { settings, updateSettings } = usePlaythrough();
	const { numberFormat, dateFormat } = getI18nState();
	const savedZone = isTimeZoneId(settings.timeZone) ? settings.timeZone : AUTOMATIC_TIME_ZONE;

	const numberExample = new Intl.NumberFormat(numberTagOf(numberFormat, locale)).format(
		SAMPLE_NUMBER
	);

	return (
		<SettingsCard title={t("title")} description={t("description")}>
			<Field label={t("language.label")} hint={t("language.hint")}>
				<Select
					value={settings.language ?? locale}
					onChange={(event) => updateSettings({ language: event.target.value })}
				>
					{SUPPORTED_LOCALES.map((code) => (
						<option key={code} value={code}>
							{languageName(code)}
						</option>
					))}
				</Select>
			</Field>
			<Field
				label={t("numberFormat.label")}
				hint={t("numberFormat.hint", { example: numberExample })}
			>
				<Select
					value={numberFormat}
					onChange={(event) => updateSettings({ numberFormat: event.target.value })}
				>
					{NUMBER_FORMATS.map((format) => (
						<option key={format.id} value={format.id}>
							{t(`numberFormat.options.${format.id satisfies NumberFormatId}`)}
						</option>
					))}
				</Select>
			</Field>
			<Field
				label={t("dateFormat.label")}
				hint={t("dateFormat.hint", { example: dateExample(dateFormat, locale) })}
			>
				<Select
					value={dateFormat}
					onChange={(event) => updateSettings({ dateFormat: event.target.value })}
				>
					{DATE_FORMATS.map((format) => (
						<option key={format.id} value={format.id}>
							{t(`dateFormat.options.${format.id}`)}
						</option>
					))}
				</Select>
			</Field>
			<Field
				label={t("timeZone.label")}
				hint={t("timeZone.hint", { example: formatDateTime(SAMPLE_INSTANT) })}
			>
				<Select
					value={savedZone}
					onChange={(event) => updateSettings({ timeZone: event.target.value })}
				>
					<option value={AUTOMATIC_TIME_ZONE}>
						{t("timeZone.auto", { zone: deviceTimeZone() })}
					</option>
					{timeZones.map((zone) => (
						<option key={zone} value={zone}>
							{zone}
						</option>
					))}
				</Select>
			</Field>
		</SettingsCard>
	);
}
