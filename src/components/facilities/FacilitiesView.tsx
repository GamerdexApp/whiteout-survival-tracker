"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import {
	buildFacilityViews,
	FACILITY_LEVEL_COUNT,
	fortressCounts,
	ownedFacilityLevelCount,
	withFacilityLevelOwned,
} from "@/service/allianceFacilities";
import type { OwnedFilter } from "@/service/allianceFacilities";
import { describeChief, updateChiefById } from "@/service/chiefs";
import { facilities, fortresses } from "@/data/game/alliance";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { StatTile } from "@/comps/ui/StatTile";
import { Tabs } from "@/comps/ui/Tabs";
import { FacilityCards } from "./FacilityCards";
import { FacilityMap } from "./FacilityMap";
import { FortressesTab } from "./FortressesTab";

type TabId = "facilities" | "fortresses" | "map";

const showIds: OwnedFilter[] = ["all", "owned", "notOwned"];

export function FacilitiesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("facilities");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const [tabId, setTabId] = useState<TabId>("facilities");
	const [show, setShow] = useState<OwnedFilter>("all");

	const views = useMemo(() => buildFacilityViews(chief, show), [chief, show]);
	const counts = fortressCounts();

	const setOwned = (facilityId: string, level: number, owned: boolean) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) =>
				withFacilityLevelOwned(current, facilityId, level, owned)
			)
		);
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: `${chief.name} · ${describeChief(chief, ui.furnaceFullLabels)}`,
					facilities: formatNumber(facilities.length),
					strongholds: formatNumber(counts.stronghold),
					fortresses: formatNumber(counts.fortress),
				})}
			/>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={t("summary.ownedValue", {
						owned: formatNumber(ownedFacilityLevelCount(chief)),
						total: formatNumber(FACILITY_LEVEL_COUNT),
					})}
					label={t("summary.owned")}
					emphasis
				/>
				<StatTile
					value={formatNumber(counts.stronghold)}
					label={t("summary.strongholds")}
				/>
				<StatTile value={formatNumber(counts.fortress)} label={t("summary.fortresses")} />
				<StatTile value={formatNumber(counts.castle)} label={t("summary.castle")} />
			</div>
			<Tabs
				label={t("tabs.label")}
				tabs={[
					{ id: "facilities", label: t("tabs.facilities"), count: facilities.length },
					{ id: "fortresses", label: t("tabs.fortresses"), count: fortresses.length },
					{ id: "map", label: t("tabs.map") },
				]}
				activeId={tabId}
				onChange={setTabId}
			>
				{tabId === "facilities" && (
					<>
						<div className="flex flex-wrap items-center gap-3">
							<span className="text-muted">{t("show.label")}</span>
							<SegmentedControl
								label={t("show.label")}
								options={showIds.map((id) => ({ id, label: t(`show.${id}`) }))}
								value={show}
								onChange={setShow}
							/>
						</div>
						{views.length === 0 ? (
							<EmptyState
								title={t("empty.title")}
								description={t("empty.description")}
								actions={
									<Button onClick={() => setShow("all")}>
										{t("empty.reset")}
									</Button>
								}
							/>
						) : (
							<FacilityCards views={views} onOwnedChange={setOwned} />
						)}
					</>
				)}
				{tabId === "fortresses" && <FortressesTab />}
				{tabId === "map" && <FacilityMap />}
			</Tabs>
		</>
	);
}
