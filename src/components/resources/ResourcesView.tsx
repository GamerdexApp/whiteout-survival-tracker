"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { allItems, itemCategories } from "@/data/game/items";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { AllItemsTab } from "./AllItemsTab";
import { CoreResourcesTab } from "./CoreResourcesTab";

const tabIds = ["core", "all"] as const;

export function ResourcesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("resources");
	const tv = useTranslations("resources.view");
	const [tabId, setTabId] = useUrlTab(tabIds, "core");

	return (
		<>
			<PageHeader
				title={t("title")}
				subline={
					tabId === "core"
						? tv("coreSubline", { chief: chief.name })
						: tv("subline", {
								items: formatNumber(allItems.length),
								categories: formatNumber(itemCategories.length),
							})
				}
			/>
			<Tabs
				label={tv("tabsLabel")}
				tabs={[
					{ id: "core", label: tv("coreTab") },
					{ id: "all", label: tv("allTab"), count: allItems.length },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "core" ? (
					<CoreResourcesTab chief={chief} />
				) : (
					<AllItemsTab chief={chief} />
				)}
			</Tabs>
		</>
	);
}
