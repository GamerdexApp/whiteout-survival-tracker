"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME, routes } from "@/data/nav";
import { wikiPageBySlug } from "@/data/wiki";

/**
 * The server renders the English title because the language is saved in the browser. This sets
 * the title again in the chosen language, and sets it again when Next replaces it on navigation.
 */
export function DocumentTitle() {
	const shell = useTranslations("shell.nav.items");
	const wiki = useTranslations("wiki");
	const pathname = usePathname();
	const [section, wikiSlug] = pathname.split("/").filter(Boolean);

	const pageTitle = () => {
		if (section === "wiki") {
			if (wikiSlug === undefined) return wiki("documentTitles.index");
			if (wikiSlug === "timeline") return wiki("documentTitles.timeline");
			const info = wikiPageBySlug(wikiSlug);
			return info ? wiki(`pages.${info.id}.title`) : undefined;
		}
		const route = routes.find((entry) => entry.href === `/${section}`);
		return route ? shell(route.id) : undefined;
	};

	const title = pageTitle();
	const fullTitle = title === undefined ? undefined : `${title} | ${APP_NAME}`;

	useEffect(() => {
		if (fullTitle === undefined) return;

		const apply = () => {
			if (document.title !== fullTitle) document.title = fullTitle;
		};
		apply();
		const observer = new MutationObserver(apply);
		observer.observe(document.head, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	}, [fullTitle]);

	return null;
}
