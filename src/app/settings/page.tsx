"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/comps/layout/PageHeader";
import { AboutTab } from "@/comps/settings/AboutTab";
import { DataTab } from "@/comps/settings/DataTab";
import { PreferencesTab } from "@/comps/settings/PreferencesTab";
import { Tabs } from "@/comps/ui/Tabs";

const tabIds = ["preferences", "data", "about"] as const;

type SettingsTabId = (typeof tabIds)[number];

const parseTab = (value: string | null): SettingsTabId =>
	tabIds.find((id) => id === value) ?? "preferences";

function SettingsContent() {
	const t = useTranslations("settings.page");
	const router = useRouter();
	const activeTab = parseTab(useSearchParams().get("tab"));

	return (
		<>
			<PageHeader title={t("title")} subline={t("subline")} />
			<Tabs
				label={t("tabsLabel")}
				tabs={tabIds.map((id) => ({ id, label: t(`tabs.${id}`) }))}
				activeId={activeTab}
				onChange={(id) => router.replace(`/settings?tab=${id}`, { scroll: false })}
			>
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
