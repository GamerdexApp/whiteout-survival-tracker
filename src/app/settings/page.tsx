"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { useSync } from "@/lib/contexts/SyncContext";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { PageHeader } from "@/comps/layout/PageHeader";
import { AboutTab } from "@/comps/settings/AboutTab";
import { DataTab } from "@/comps/settings/DataTab";
import { PreferencesTab } from "@/comps/settings/PreferencesTab";
import { SyncTab } from "@/comps/settings/SyncTab";
import { Tabs } from "@/comps/ui/Tabs";

const tabIds = ["sync", "preferences", "data", "about"] as const;

function SettingsContent() {
	const t = useTranslations("settings.page");
	const { available } = useSync();
	const [activeTab, setActiveTab] = useUrlTab(tabIds, available ? "sync" : "preferences");

	return (
		<>
			<PageHeader title={t("title")} subline={t("subline")} />
			<Tabs
				label={t("tabsLabel")}
				tabs={tabIds.map((id) => ({ id, label: t(`tabs.${id}`) }))}
				activeId={activeTab}
				onChange={setActiveTab}
			>
				{activeTab === "preferences" && <PreferencesTab />}
				{activeTab === "data" && <DataTab />}
				{activeTab === "sync" && <SyncTab />}
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
