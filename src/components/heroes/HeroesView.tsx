"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { buildHeroViews } from "@/service/heroes";
import { gearSetsOf } from "@/service/heroGear";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { HeroesTab } from "./HeroesTab";
import { HeroGearTab } from "./HeroGearTab";

const tabIds = ["heroes", "gear"] as const;

export function HeroesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("heroes.view");
	const [tabId, setTabId] = useUrlTab(tabIds, "heroes");
	const heroViews = buildHeroViews(chief);
	const owned = heroViews.filter((view) => view.owned).length;
	const sets = gearSetsOf(chief);

	return (
		<>
			<PageHeader
				wikiPage={tabId === "gear" ? "heroGear" : "heroes"}
				title={t("heroesTab")}
				subline={
					tabId === "heroes"
						? t("heroesSubline", {
								chief: chief.name,
								owned: formatNumber(owned),
								total: formatNumber(heroViews.length),
							})
						: t("gearSubline", {
								chief: chief.name,
								count: sets.length,
								amount: formatNumber(sets.length),
							})
				}
			/>
			<Tabs
				label={t("tabsLabel")}
				tabs={[
					{ id: "heroes", label: t("heroesTab"), count: heroViews.length },
					{ id: "gear", label: t("gearTab"), count: sets.length },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "heroes" ? <HeroesTab chief={chief} /> : <HeroGearTab chief={chief} />}
			</Tabs>
		</>
	);
}
