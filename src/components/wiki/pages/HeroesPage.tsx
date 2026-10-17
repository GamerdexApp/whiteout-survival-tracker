"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { allHeroes, findHero } from "@/data/game/heroes";
import { widgetLevels } from "@/data/game/wikiHeroes";
import { HeroDetail } from "../heroes/HeroDetail";
import { HeroRoster } from "../heroes/HeroRoster";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function HeroesPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiHeroes");

	if (recordId === undefined) {
		return (
			<WikiPageShell
				id="heroes"
				line={t("line", {
					heroes: formatNumber(allHeroes.length),
					widgets: formatNumber(widgetLevels.length),
				})}
			>
				<HeroRoster />
			</WikiPageShell>
		);
	}

	const hero = findHero(recordId);
	if (!hero) return <WikiRecordMissing id="heroes" />;

	return (
		<WikiPageShell
			id="heroes"
			recordName={hero.name}
			line={t("recordLine", {
				rarity: hero.rarity,
				heroClass: hero.class,
				generation: formatNumber(hero.generation),
			})}
		>
			<HeroDetail hero={hero} />
		</WikiPageShell>
	);
}
