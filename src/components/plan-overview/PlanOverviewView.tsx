"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatDuration, formatNumber } from "@/lib/format";
import { usePlanOverviewOff } from "@/lib/hooks/usePlanOverviewOff";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { withSavedBeastPlan } from "@/service/beasts";
import type { BeastPlanDraft } from "@/service/beasts";
import { updateChiefById } from "@/service/chiefs";
import { overviewOf, summarizePlans } from "@/service/planOverview";
import { BeastPlanFlyout } from "@/comps/core-events/BeastPlanFlyout";
import { PageHeader } from "@/comps/layout/PageHeader";
import { EmptyState } from "@/comps/ui/EmptyState";
import { StatTile } from "@/comps/ui/StatTile";
import { OverviewFullPlan } from "./OverviewFullPlan";
import { OverviewPoints } from "./OverviewPoints";
import { OverviewResources } from "./OverviewResources";
import { PlanChips } from "./PlanChips";

export function PlanOverviewView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("planOverview");
	const tNav = useTranslations("shell.nav.items");
	const tCommon = useTranslations("common");
	const { ui } = useUiSettings();
	const { off, toggle } = usePlanOverviewOff(chief.id);
	const { updateData } = usePlaythrough();
	const [beastPlanOpen, setBeastPlanOpen] = useState(false);
	const saveBeastPlan = (plan: BeastPlanDraft) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) =>
				withSavedBeastPlan(current, plan, new Date().toISOString())
			)
		);
	};
	const summaries = useMemo(
		() => summarizePlans(chief, { useBonuses: ui.calcUseBonuses }),
		[chief, ui.calcUseBonuses]
	);
	const overview = useMemo(() => overviewOf(chief, summaries, off), [chief, summaries, off]);

	return (
		<>
			<PageHeader title={tNav("planOverview")} subline={t("subline")} />
			<PlanChips
				available={summaries.map((plan) => plan.id)}
				off={off}
				onToggle={toggle}
				onPlanBeasts={() => setBeastPlanOpen(true)}
			/>
			{summaries.length === 0 ? (
				<EmptyState title={t("empty.title")} description={t("empty.description")} />
			) : overview.plans.length === 0 ? (
				<EmptyState title={t("allOff.title")} description={t("allOff.description")} />
			) : (
				<>
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
						<StatTile
							value={`+${formatNumber(overview.power)}`}
							label={tCommon("powerGained")}
							emphasis
						/>
						<StatTile
							value={formatNumber(overview.points.svs)}
							label={t("tiles.svs")}
							emphasis
						/>
						<StatTile
							value={formatNumber(overview.shortCount)}
							label={t("tiles.short")}
						/>
						<StatTile
							value={
								overview.longestSeconds > 0
									? formatDuration(overview.longestSeconds)
									: "0"
							}
							label={t("tiles.longest")}
						/>
					</div>
					{overview.itemCount > 0 && <OverviewResources overview={overview} />}
					<OverviewPoints overview={overview} />
					<OverviewFullPlan
						overview={overview}
						onEditBeasts={() => setBeastPlanOpen(true)}
					/>
				</>
			)}
			<BeastPlanFlyout
				open={beastPlanOpen}
				chief={chief}
				onClose={() => setBeastPlanOpen(false)}
				onSave={saveBeastPlan}
			/>
		</>
	);
}
