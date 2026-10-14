"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/comps/layout/PageHeader";
import { AboutTab } from "@/comps/settings/AboutTab";
import { DataTab } from "@/comps/settings/DataTab";
import { PreferencesTab } from "@/comps/settings/PreferencesTab";
import { SyncTab } from "@/comps/settings/SyncTab";
import { Tabs } from "@/comps/ui/Tabs";

const tabs = [
	{ id: "sync", label: "Sync" },
	{ id: "preferences", label: "Preferences" },
	{ id: "data", label: "Backup and data" },
	{ id: "about", label: "About" },
] as const;

type SettingsTabId = (typeof tabs)[number]["id"];

const parseTab = (value: string | null): SettingsTabId =>
	tabs.find((tab) => tab.id === value)?.id ?? "sync";

function SettingsContent() {
	const router = useRouter();
	const activeTab = parseTab(useSearchParams().get("tab"));

	return (
		<>
			<PageHeader
				title="Settings"
				subline="Manage your data, sync, chief settings and appearance"
			/>
			<Tabs
				label="Settings"
				tabs={[...tabs]}
				activeId={activeTab}
				onChange={(id) => router.replace(`/settings?tab=${id}`, { scroll: false })}
			>
				{activeTab === "sync" && <SyncTab />}
				{activeTab === "preferences" && <PreferencesTab />}
				{activeTab === "data" && <DataTab />}
				{activeTab === "about" && <AboutTab />}
			</Tabs>
		</>
	);
}

export default function SettingsPage() {
	return (
		<Suspense fallback={null}>
			<SettingsContent />
		</Suspense>
	);
}
