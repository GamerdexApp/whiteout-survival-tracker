"use client";

import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { buildHeroViews } from "@/service/heroes";
import { gearSetsOf } from "@/service/heroGear";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { HeroesTab } from "./HeroesTab";
import { HeroGearTab } from "./HeroGearTab";

type HeroesTabId = "heroes" | "gear";

export function HeroesView({ chief }: { chief: Playthrough }) {
	const [tabId, setTabId] = useState<HeroesTabId>("heroes");
	const heroViews = buildHeroViews(chief);
	const owned = heroViews.filter((view) => view.owned).length;
	const sets = gearSetsOf(chief);

	return (
		<>
			<PageHeader
				title="Heroes"
				subline={
					tabId === "heroes"
						? `${chief.name} · ${owned} of ${heroViews.length} owned`
						: `${chief.name} · ${sets.length} gear ${sets.length === 1 ? "set" : "sets"}`
				}
			/>
			<Tabs
				label="Heroes"
				tabs={[
					{ id: "heroes", label: "Heroes", count: heroViews.length },
					{ id: "gear", label: "Hero Gear", count: sets.length },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "heroes" ? <HeroesTab chief={chief} /> : <HeroGearTab chief={chief} />}
			</Tabs>
		</>
	);
}
