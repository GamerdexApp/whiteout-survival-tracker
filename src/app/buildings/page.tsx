"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { allBuildings, allFacilities } from "@/data/game/buildings";
import { BuildingsTab } from "@/comps/buildings/BuildingsTab";
import { FacilitiesTab } from "@/comps/buildings/FacilitiesTab";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";

const tabs = [
	{ id: "buildings", label: "Buildings", count: allBuildings.length },
	{ id: "facilities", label: "Facilities", count: allFacilities.length },
] as const;

type BuildingsTabId = (typeof tabs)[number]["id"];

const parseTab = (value: string | null): BuildingsTabId =>
	tabs.find((tab) => tab.id === value)?.id ?? "buildings";

function BuildingsContent() {
	const router = useRouter();
	const activeTab = parseTab(useSearchParams().get("tab"));

	return (
		<ChiefGate title="Buildings">
			{(chief) => (
				<>
					<PageHeader title="Buildings" />
					<Tabs
						label="Buildings"
						tabs={[...tabs]}
						activeId={activeTab}
						onChange={(id) => router.replace(`/buildings?tab=${id}`, { scroll: false })}
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
