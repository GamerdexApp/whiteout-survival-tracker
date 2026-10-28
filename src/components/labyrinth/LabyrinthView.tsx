"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import { buildLabyrinthView, withZoneStages } from "@/service/labyrinth";
import { withFormations } from "@/service/labyrinthFormations";
import type { FormationsDraft } from "@/service/labyrinthFormations";
import { LABYRINTH_GLOWSTONE_PER_STAGE, LABYRINTH_IMAGE } from "@/data/game/labyrinth";
import type { LabyrinthZone } from "@/data/game/labyrinth";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
import { FormationsFlyout } from "./FormationsFlyout";
import { JustusCard } from "./JustusCard";
import { MilestonesCard, RaidRewardsCard, ShopCard } from "./RewardsCards";
import { ZoneCard } from "./ZoneCard";

export function LabyrinthView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("labyrinth");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const showToast = useToast();
	const [formationsOpen, setFormationsOpen] = useState(false);

	const view = useMemo(() => buildLabyrinthView(chief), [chief]);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const changeStages = (zone: LabyrinthZone, stages: number) =>
		change((current) => withZoneStages(current, zone, stages));

	const saveFormations = (draft: FormationsDraft) => {
		const before = chief;
		if (!change((current) => withFormations(current, draft))) return;
		setFormationsOpen(false);
		showToast({
			variant: "success",
			title: t("formations.toast.title"),
			message: t("formations.toast.message"),
			action: { label: t("formations.toast.undo"), onAction: () => change(() => before) },
		});
	};

	return (
		<>
			<PageHeader
				icon={<ItemIcon src={LABYRINTH_IMAGE} size={44} />}
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
					done: formatNumber(view.stagesCleared),
					total: formatNumber(view.stagesTotal),
				})}
			/>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={t("summary.stagesValue", {
						done: formatNumber(view.stagesCleared),
						total: formatNumber(view.stagesTotal),
					})}
					label={t("summary.stages")}
				/>
				<StatTile value={formatNumber(view.stagesCleared)} label={t("summary.cores")} />
				<StatTile value={formatNumber(view.weeklyBase)} label={t("summary.weekly")} />
				<StatTile
					emphasis
					value={formatNumber(view.weeklyTotal)}
					label={t("summary.weeklyWithJustus")}
				/>
			</div>

			<div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
				<Card className="flex flex-col gap-4 p-4">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<h2 className="font-semibold">{t("zones.title")}</h2>
							<p className="text-muted">{t("zones.hint")}</p>
						</div>
						<Button onClick={() => setFormationsOpen(true)}>
							{t("formations.button")}
						</Button>
					</div>
					<ul className="flex flex-col">
						{view.zones.map((zoneView) => (
							<ZoneCard
								key={zoneView.zone.id}
								view={zoneView}
								onStagesChange={(stages) => changeStages(zoneView.zone, stages)}
							/>
						))}
					</ul>
				</Card>
				<div className="flex flex-col gap-4">
					<JustusCard level={view.justusLevel} />
					<Card className="flex flex-col gap-2 p-4">
						<h2 className="font-semibold">{t("rules.title")}</h2>
						<p className="text-muted">
							{t("rules.body", {
								perStage: formatNumber(LABYRINTH_GLOWSTONE_PER_STAGE),
							})}
						</p>
					</Card>
				</div>
			</div>

			<div className="grid items-start gap-4 lg:grid-cols-2">
				<MilestonesCard milestones={view.milestones} cores={view.stagesCleared} />
				<div className="flex flex-col gap-4">
					<ShopCard />
					<RaidRewardsCard />
				</div>
			</div>
			<FormationsFlyout
				open={formationsOpen}
				chief={chief}
				onClose={() => setFormationsOpen(false)}
				onSave={saveFormations}
			/>
		</>
	);
}
