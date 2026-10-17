"use client";

import { NextIntlClientProvider } from "next-intl";
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { storageService } from "@/service/storage";
import {
	DEFAULT_DATE_FORMAT,
	DEFAULT_NUMBER_FORMAT,
	isDateFormatId,
	isNumberFormatId,
} from "./formats";
import { configureI18n } from "./formatter";
import { DEFAULT_LOCALE, isSupportedLocale, loadMessages } from "./locales";
import type { Locale, Messages } from "./locales";
import en from "./messages/en";
import { isTimeZoneId } from "./zones";

/**
 * Reads the language and formats from the saved settings and gives every component its messages.
 * It sits outside the data provider, so it reads the stored settings itself. English is part of
 * the first page load. Another language loads after the page opens and English shows until then.
 *
 * Plain functions such as `formatNumber` read module state. The children are keyed by the
 * choices, so they render again with the new formats as soon as a choice changes.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
	const settings = useSyncExternalStore(
		storageService.subscribe,
		() => storageService.load().settings,
		() => undefined
	);
	const locale: Locale = isSupportedLocale(settings?.language)
		? settings.language
		: DEFAULT_LOCALE;
	const numberFormat = isNumberFormatId(settings?.numberFormat)
		? settings.numberFormat
		: DEFAULT_NUMBER_FORMAT;
	const dateFormat = isDateFormatId(settings?.dateFormat)
		? settings.dateFormat
		: DEFAULT_DATE_FORMAT;

	const timeZone = isTimeZoneId(settings?.timeZone) ? settings.timeZone : undefined;

	const [loaded, setLoaded] = useState<{ locale: Locale; messages: Messages }>({
		locale: DEFAULT_LOCALE,
		messages: en,
	});

	useEffect(() => {
		let current = true;
		loadMessages(locale).then((messages) => {
			if (current) setLoaded({ locale, messages });
		});
		return () => {
			current = false;
		};
	}, [locale]);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	// A language shows English until its catalog has loaded, so a message is never missing.
	const ready = loaded.locale === locale;
	const activeLocale = ready ? locale : DEFAULT_LOCALE;
	const messages = ready ? loaded.messages : en;
	configureI18n({ locale: activeLocale, messages, numberFormat, dateFormat, timeZone });

	return (
		<NextIntlClientProvider locale={activeLocale} messages={messages}>
			<Fragment key={`${activeLocale}|${numberFormat}|${dateFormat}|${timeZone ?? "auto"}`}>
				{children}
			</Fragment>
		</NextIntlClientProvider>
	);
}
