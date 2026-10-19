"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { useStaticUrlTab } from "@/lib/hooks/useUrlTab";
import { forgingRows } from "@/data/game/heroGear";
import { empowermentRows, enhancementRows, statEntries } from "@/data/game/wikiHeroGear";
import { Tabs } from "@/comps/ui/Tabs";
import { GearLevelTables } from "../hero-gear/GearLevelTables";
import { GearStatsTable } from "../hero-gear/GearStatsTable";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const TAB_IDS = ["enhancement", "empowerment", "mastery", "stats"] as const;

export function HeroGearPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiHeroGear");
	const [tab, setTab] = useStaticUrlTab(TAB_IDS, "enhancement");

	if (recordId !== undefined) return <WikiRecordMissing id="heroGear" />;

	const tabs = [
		{ id: "enhancement" as const, count: enhancementRows.length },
		{ id: "empowerment" as const, count: empowermentRows.length },
		{ id: "mastery" as const, count: forgingRows.length },
		{ id: "stats" as const, count: statEntries.length },
	].map((entry) => ({ ...entry, label: t(`tabs.${entry.id}`) }));

	return (
		<WikiPageShell
			id="heroGear"
			line={t("line", {
				enhancement: formatNumber(enhancementRows.length),
				empowerment: formatNumber(empowermentRows.length),
				mastery: formatNumber(forgingRows.length),
				stats: formatNumber(statEntries.length),
			})}
		>
			<Tabs label={t("tabsLabel")} tabs={tabs} activeId={tab} onChange={setTab}>
				{tab === "stats" ? <GearStatsTable /> : <GearLevelTables key={tab} kind={tab} />}
			</Tabs>
		</WikiPageShell>
	);
}
