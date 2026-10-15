"use client";

import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { CharmsTab } from "./CharmsTab";
import { GearTab } from "./GearTab";

type ChiefGearTabId = "gear" | "charms";

export function ChiefGearView({ chief }: { chief: Playthrough }) {
	const [tabId, setTabId] = useState<ChiefGearTabId>("gear");

	return (
		<>
			<PageHeader
				title="Chief Gear"
				subline={
					tabId === "gear"
						? `${chief.name} · six slots, 150 upgrade rows`
						: `${chief.name} · 6 gear pieces, 3 charms each, 75 upgrade rows`
				}
			/>
			<Tabs
				label="Chief gear"
				tabs={[
					{ id: "gear", label: "Chief Gear" },
					{ id: "charms", label: "Chief Charms" },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "gear" ? <GearTab chief={chief} /> : <CharmsTab chief={chief} />}
			</Tabs>
		</>
	);
}
