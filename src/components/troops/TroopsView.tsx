"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough, TroopId } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatFurnaceLevel } from "@/lib/format";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { updateChiefById } from "@/service/chiefs";
import { campJob, cancelJob, endsAtAfter, finishTraining, withJobEndsAt } from "@/service/queues";
import { callOfWarOf, callOfWarTierOf, withCallOfWarClaim } from "@/service/troopCallOfWar";
import { startTraining } from "@/service/troopQueue";
import type { StartTrainingInput } from "@/service/troopQueue";
import {
	buildTroopViews,
	campOf,
	hideLowTiersAvailable,
	hideLowTiersOn,
	withHideLowTiers,
	withTroopCount,
} from "@/service/troops";
import type { TroopTypeView } from "@/service/troops";
import { withSavedTroopsPlan } from "@/service/troopsPlan";
import type { TroopsPlanDraft } from "@/service/troopsPlan";
import { findTroop } from "@/data/game/troops";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ManageUpgradeFlyout } from "@/comps/queues/ManageUpgradeFlyout";
import type { ManageTarget } from "@/comps/queues/ManageUpgradeFlyout";
import { Button } from "@/comps/ui/Button";
import { useToast } from "@/comps/ui/Toast";
import { CallOfWar } from "./CallOfWar";
import { StartTrainingFlyout } from "./StartTrainingFlyout";
import { TroopQueues } from "./TroopQueues";
import { TroopsPlanFlyout } from "./TroopsPlanFlyout";
import { TroopTiers } from "./TroopTiers";
import { TroopTypeCards } from "./TroopTypeCards";

export function TroopsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("troops.view");
	const tq = useTranslations("troops.queue");
	const tcw = useTranslations("troops.callOfWar");
	const showToast = useToast();
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const [selectedId, setSelectedId] = useState<TroopId>("infantry");
	const [planOpen, setPlanOpen] = useState(false);
	const [startOpen, setStartOpen] = useState(false);
	const [manageCamp, setManageCamp] = useState<TroopId | null>(null);

	const views = useMemo(() => buildTroopViews(chief), [chief]);
	const selected = views.find((view) => view.id === selectedId) as TroopTypeView;
	const hideLowAvailable = hideLowTiersAvailable(chief);
	const hideLow = hideLowTiersOn(chief);
	const furnaceLevel = chief.buildings?.furnace?.level;

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const savePlan = (draft: TroopsPlanDraft) => {
		change((current) => withSavedTroopsPlan(current, draft, new Date().toISOString()));
	};

	const batchText = (job: NonNullable<ReturnType<typeof campJob>>) => {
		const name = findTroop(job.camp)?.name ?? job.camp;
		return job.mode === "training"
			? tq("batchName.training", {
					count: formatNumber(job.count),
					name,
					tier: job.tier ?? 0,
				})
			: tq("batchName.promotion", {
					count: formatNumber(job.count),
					name,
					from: job.fromTier ?? 0,
					to: job.toTier ?? 0,
				});
	};

	const managedJob = manageCamp === null ? undefined : campJob(chief, manageCamp);
	const manageTarget: ManageTarget | null =
		managedJob && manageCamp
			? {
					title: campOf(manageCamp).name,
					summary: batchText(managedJob),
					slotLabel: tq("manage.slotLabel", { camp: campOf(manageCamp).name }),
					finishText: tq("manage.finishText"),
					job: managedJob,
				}
			: null;

	const start = (inputs: StartTrainingInput[]) => {
		if (!change((current) => inputs.reduce(startTraining, current))) return;
		setStartOpen(false);
		const what = inputs
			.map(({ batch }) => {
				const name = findTroop(batch.camp)?.name ?? batch.camp;
				return batch.mode === "training"
					? tq("batchName.training", {
							count: formatNumber(batch.count),
							name,
							tier: batch.tier,
						})
					: tq("batchName.promotion", {
							count: formatNumber(batch.count),
							name,
							from: batch.fromTier,
							to: batch.toTier,
						});
			})
			.join(", ");
		showToast({
			variant: "success",
			title: tq("toasts.started.title"),
			message: tq("toasts.started.message", { what }),
		});
	};

	const finishCamp = (camp: TroopId) => {
		const job = campJob(chief, camp);
		if (!job) return;
		const before = chief;
		if (!change((current) => finishTraining(current, job, new Date().toISOString()))) return;
		setManageCamp(null);
		showToast({
			variant: "success",
			title: tq("toasts.finished.title", { what: batchText(job) }),
			message: tq("toasts.finished.message"),
			action: { label: tq("toasts.undo"), onAction: () => change(() => before) },
		});
	};

	const finishManaged = () => {
		if (manageCamp !== null) finishCamp(manageCamp);
	};

	const cancelManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (!change((current) => cancelJob(current, { kind: "training", camp: managedJob.camp })))
			return;
		setManageCamp(null);
		showToast({
			variant: "warning",
			title: tq("toasts.cancelled.title", { what: batchText(managedJob) }),
			message: tq("toasts.cancelled.message"),
			action: { label: tq("toasts.undo"), onAction: () => change(() => before) },
		});
	};

	const claimCallOfWar = (camp: TroopId) => {
		const callOfWar = callOfWarOf(chief);
		const tier = callOfWarTierOf(chief, camp);
		if (!callOfWar || !tier) return;
		const before = chief;
		if (!change((current) => withCallOfWarClaim(current, camp, new Date()))) return;
		showToast({
			variant: "success",
			title: tcw("toast.title"),
			message: tcw("toast.message", {
				troops: formatNumber(callOfWar.troops),
				camp: findTroop(camp)?.name ?? camp,
				tier,
			}),
			action: { label: tcw("toast.undo"), onAction: () => change(() => before) },
		});
	};

	const campText = (view: TroopTypeView) =>
		t("campLevel", { name: view.name, level: view.campLabel ?? t("notBuilt") });

	return (
		<>
			<PageHeader
				title={t("title")}
				subline={t("subline", {
					chief: chief.name,
					camps: views.map(campText).join(" · "),
				})}
			/>
			<div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
				<p className="text-muted max-lg:order-last">{t("intro")}</p>
				<div className="flex gap-3 max-lg:flex-wrap">
					<Button className="max-lg:flex-1" onClick={() => setStartOpen(true)}>
						{tq("startButton")}
					</Button>
					<Button
						variant="primary"
						className="max-lg:flex-1"
						onClick={() => setPlanOpen(true)}
					>
						{t("plan")}
					</Button>
				</div>
			</div>
			<TroopQueues chief={chief} onManage={setManageCamp} onFinish={finishCamp} />
			<CallOfWar chief={chief} onClaim={claimCallOfWar} />
			<TroopTypeCards
				views={views}
				selectedId={selectedId}
				totalPower={views.reduce((sum, view) => sum + view.power, 0)}
				totalTroops={views.reduce((sum, view) => sum + view.total, 0)}
			/>
			<TroopTiers
				view={selected}
				views={views}
				hideLowAvailable={hideLowAvailable}
				hideLow={hideLow}
				furnaceText={
					furnaceLevel ? formatFurnaceLevel(furnaceLevel, ui.furnaceFullLabels) : ""
				}
				onSelect={setSelectedId}
				onHideLowChange={(value) => change((current) => withHideLowTiers(current, value))}
				onCountChange={(tier, count) =>
					change((current) => withTroopCount(current, selectedId, tier, count))
				}
			/>
			<StartTrainingFlyout
				open={startOpen}
				chief={chief}
				initialCamp={selectedId}
				onClose={() => setStartOpen(false)}
				onStart={start}
			/>
			<ManageUpgradeFlyout
				target={manageTarget}
				onClose={() => setManageCamp(null)}
				onSetSecondsLeft={(seconds) => {
					if (manageCamp === null) return;
					change((current) =>
						withJobEndsAt(
							current,
							{ kind: "training", camp: manageCamp },
							endsAtAfter(new Date(), seconds)
						)
					);
				}}
				onFinish={finishManaged}
				onCancel={cancelManaged}
			/>
			<TroopsPlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
