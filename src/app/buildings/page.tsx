"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { allBuildings, allFacilities } from "@/data/game/buildings";
import { BuildingsTab } from "@/comps/buildings/BuildingsTab";
import { FacilitiesTab } from "@/comps/buildings/FacilitiesTab";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";

const tabs = [
	{ id: "buildings", count: allBuildings.length },
	{ id: "facilities", count: allFacilities.length },
] as const;

const tabIds = tabs.map((tab) => tab.id);

function BuildingsContent() {
	const t = useTranslations("buildings");
	const [activeTab, setActiveTab] = useUrlTab(tabIds, "buildings");

	return (
		<ChiefGate title={t("title")}>
			{(chief) => (
				<>
					<PageHeader title={t("title")} />
					<Tabs
						label={t("title")}
						tabs={tabs.map((tab) => ({ ...tab, label: t(`tabs.${tab.id}`) }))}
						activeId={activeTab}
						onChange={setActiveTab}
					>
						{activeTab === "buildings" && <BuildingsTab chief={chief} />}
						{activeTab === "facilities" && <FacilitiesTab chief={chief} />}
					</Tabs>
				</>
			)}
		</ChiefGate>
	);
}

export default function BuildingsPage() {
	return (
		<Suspense fallback={null}>
			<BuildingsContent />
		</Suspense>
	);
}
