"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { CharmsTab } from "./CharmsTab";
import { GearTab } from "./GearTab";

type ChiefGearTabId = "gear" | "charms";

export function ChiefGearView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("chiefGear.view");
	const [tabId, setTabId] = useState<ChiefGearTabId>("gear");

	return (
		<>
			<PageHeader
				wikiPage={tabId === "charms" ? "chiefCharms" : "chiefGear"}
				title={t("title")}
				subline={
					tabId === "gear"
						? t("gearSubline", { name: chief.name })
						: t("charmsSubline", { name: chief.name })
				}
			/>
			<Tabs
				label={t("tabsLabel")}
				tabs={[
					{ id: "gear", label: t("tabs.gear") },
					{ id: "charms", label: t("tabs.charms") },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "gear" ? <GearTab chief={chief} /> : <CharmsTab chief={chief} />}
			</Tabs>
		</>
	);
}
