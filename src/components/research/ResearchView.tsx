"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
	LuClipboardList,
	LuLayoutGrid,
	LuListFilter,
	LuNetwork,
	LuPencilLine,
	LuPlay,
	LuSearch,
} from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import type { ResearchQueueId } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { researchSpeedBonusPercent } from "@/service/bonuses";
import { updateChiefById } from "@/service/chiefs";
import { cancelJob, endsAtAfter, finishResearch, queueJob, withJobEndsAt } from "@/service/queues";
import type { StartPayload } from "@/service/queues";
import type { ResearchFilters } from "@/service/research";
import {
	buildAllNodeViews,
	countResearchFilters,
	defaultResearchFilters,
	filterNodeViews,
	nodesOfTabCount,
	powerOfViews,
	summarizeResearch,
	tabLockOf,
	tabLockText,
	viewsOfTab,
	withResearchLevel,
	withResearchLevels,
} from "@/service/research";
import type { MassSetPlan } from "@/service/researchMassSet";
import { withSavedResearchPlan } from "@/service/researchPlan";
import type { ResearchPlanControls, ResearchPlanRow } from "@/service/researchPlan";
import { researchOptions, researchSlots, startResearch } from "@/service/researchUpgrades";
import { researchTabs, tabName } from "@/data/game/research";
import type { ResearchTab } from "@/data/game/research";
import { findResearch } from "@/data/game/research";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ManageUpgradeFlyout } from "@/comps/queues/ManageUpgradeFlyout";
import type { ManageTarget } from "@/comps/queues/ManageUpgradeFlyout";
import { StartUpgradeFlyout } from "@/comps/queues/StartUpgradeFlyout";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { StatTile } from "@/comps/ui/StatTile";
import { Tabs } from "@/comps/ui/Tabs";
import { useToast } from "@/comps/ui/Toast";
import { NodeCard } from "./NodeCard";
import { NodeFlyout } from "./NodeFlyout";
import { QueuesStrip } from "./QueuesStrip";
import { ResearchFiltersFlyout } from "./ResearchFiltersFlyout";
import { ResearchMassSetDialog } from "./ResearchMassSetDialog";
import { ResearchPlanFlyout } from "./ResearchPlanFlyout";
import { ResearchTree } from "./ResearchTree";

export function ResearchView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("research");
	const tq = useTranslations("queues");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [tabId, setTabId] = useState<string>(researchTabs[0].id);
	const [filters, setFilters] = useState<ResearchFilters>(defaultResearchFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [massSetOpen, setMassSetOpen] = useState(false);
	const [openNodeId, setOpenNodeId] = useState<string | null>(null);
	const [startOpen, setStartOpen] = useState(false);
	const [planOpen, setPlanOpen] = useState(false);
	const [layout, setLayout] = useState<"grid" | "tree">("grid");
	const [manageQueue, setManageQueue] = useState<ResearchQueueId | null>(null);
	const now = useNow();

	const tab = researchTabs.find((item) => item.id === tabId) as ResearchTab;
	const allViews = useMemo(() => buildAllNodeViews(chief), [chief]);
	const summary = useMemo(() => summarizeResearch(allViews), [allViews]);
	const tabViews = useMemo(() => viewsOfTab(allViews, tab), [allViews, tab]);
	const visible = useMemo(() => filterNodeViews(tabViews, filters), [tabViews, filters]);
	const tabLock = tabLockOf(tab, chief);
	const lockedByRequirement = tabViews.filter((view) => view.lockedBy !== null).length;
	const openView = allViews.find((view) => view.node.id === openNodeId) ?? null;

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const switchTab = (id: string) => {
		setTabId(id);
		setFilters({ ...defaultResearchFilters(), search: filters.search });
	};

	const saveMassSet = (plan: MassSetPlan) => {
		const before = chief;
		const levels = Object.fromEntries(plan.changes.map((item) => [item.node.id, item.to]));
		if (!change((current) => withResearchLevels(current, levels))) return;
		setMassSetOpen(false);
		showToast({
			variant: "success",
			title: t("view.massSetApplied.title"),
			message: t("view.massSetApplied.message", {
				nodes: t("nodeCount", {
					count: plan.changes.length,
					amount: formatNumber(plan.changes.length),
				}),
			}),
			action: { label: t("view.undo"), onAction: () => change(() => before) },
		});
	};

	const options = useMemo(() => researchOptions(allViews, chief), [allViews, chief]);

	const startUpgrade = (payload: StartPayload) => {
		const option = options.find((item) => item.id === payload.optionId);
		if (!option) return;
		if (!change((current) => startResearch(current, option, payload))) return;
		setStartOpen(false);
		showToast({
			variant: "success",
			title: t("view.started.title"),
			message: t("view.started.message", {
				name: option.name,
				from: formatNumber(Number(option.from)),
				to: formatNumber(Number(option.to)),
			}),
		});
	};

	const managedJob = manageQueue === null ? undefined : queueJob(chief, manageQueue);
	const managedNode = managedJob ? findResearch(managedJob.nodeId) : undefined;
	const managedName = managedNode?.name ?? managedJob?.nodeId ?? "";
	const manageTarget: ManageTarget | null =
		managedJob && managedNode
			? {
					title: managedName,
					summary: t("jobTitle", {
						name: managedName,
						from: formatNumber(managedJob.from),
						to: formatNumber(managedJob.to),
					}),
					slotLabel: t("view.manage.slotLabel", {
						queue: tq(`researchQueues.${managedJob.queue}.name`),
						category: managedNode.category,
					}),
					finishText: t("view.manage.finishText", {
						name: managedName,
						level: formatNumber(managedJob.to),
						queue: tq(`researchQueues.${managedJob.queue}.shortName`),
					}),
					job: managedJob,
				}
			: null;

	const finishQueue = (queue: ResearchQueueId) => {
		const job = queueJob(chief, queue);
		if (!job) return;
		const before = chief;
		if (!change((current) => finishResearch(current, job, new Date().toISOString()))) return;
		setManageQueue(null);
		showToast({
			variant: "success",
			title: t("view.finished.title", { name: findResearch(job.nodeId)?.name ?? job.nodeId }),
			message: t("view.finished.message", { level: formatNumber(job.to) }),
			action: { label: t("view.undo"), onAction: () => change(() => before) },
		});
	};

	const finishManaged = () => {
		if (manageQueue !== null) finishQueue(manageQueue);
	};

	const cancelManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (!change((current) => cancelJob(current, { kind: "research", queue: managedJob.queue })))
			return;
		setManageQueue(null);
		showToast({
			variant: "warning",
			title: t("view.cancelled.title", { name: managedName }),
			message: t("view.cancelled.message"),
			action: { label: t("view.undo"), onAction: () => change(() => before) },
		});
	};

	const savePlan = (rows: ResearchPlanRow[], controls: ResearchPlanControls) => {
		change((current) =>
			withSavedResearchPlan(current, rows, controls, new Date().toISOString())
		);
	};

	const buildingLevel = (id: string) => chief.buildings?.[id]?.level;
	const subline = [
		chief.name,
		t("view.subline.researchCenter", {
			level: buildingLevel("research-center") ?? t("unknown"),
		}),
		t("view.subline.warAcademy", { level: buildingLevel("war-academy") ?? t("unknown") }),
	].join(" · ");

	const activeFilters = countResearchFilters(filters);

	return (
		<>
			<PageHeader title={t("title")} subline={subline} />
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={t("view.ofTotal", {
						count: formatNumber(summary.maxed),
						total: formatNumber(summary.total),
					})}
					label={t("view.stats.maxed", {
						percent: formatNumber(Math.round((summary.maxed / summary.total) * 100)),
					})}
				/>
				<StatTile
					value={formatNumber(summary.power)}
					label={t("view.stats.power")}
					emphasis
				/>
				<StatTile
					value={t("nodeCount", {
						count: summary.withoutTime,
						amount: formatNumber(summary.withoutTime),
					})}
					label={
						summary.withoutTime === 0
							? t("view.stats.withoutTimeNone")
							: t("view.stats.withoutTimeSome")
					}
				/>
				<StatTile
					value={t("view.ofTotal", {
						count: formatNumber(summary.locked),
						total: formatNumber(summary.total),
					})}
					label={t("view.stats.locked")}
				/>
			</div>

			<QueuesStrip chief={chief} onManage={setManageQueue} onFinish={finishQueue} />

			<Tabs
				label={t("title")}
				tabs={researchTabs.map((item) => ({
					id: item.id,
					label: tabName(item),
					count: nodesOfTabCount(item),
					locked: tabLockOf(item, chief) !== null,
				}))}
				activeId={tabId}
				onChange={switchTab}
			>
				{tabLock && (
					<Note tone="warning">
						{t("view.tabLockedNote", { reason: tabLockText(tab, tabLock) })}
					</Note>
				)}
				{!tabLock && lockedByRequirement > 0 && (
					<Note>
						{t("view.lockedByRequirement", {
							count: formatNumber(lockedByRequirement),
							total: formatNumber(tabViews.length),
						})}
					</Note>
				)}

				<div className="flex flex-wrap items-center gap-3">
					<div className="w-full lg:w-auto lg:flex-1">
						<Input
							type="search"
							aria-label={t("view.search.label")}
							placeholder={t("view.search.placeholder")}
							leadingIcon={<LuSearch size={16} />}
							value={filters.search}
							onChange={(event) =>
								setFilters({ ...filters, search: event.target.value })
							}
						/>
					</div>
					<div className="flex w-full flex-wrap gap-3 lg:w-auto lg:flex-nowrap">
						<Button
							className="order-1 flex-1 lg:flex-none"
							onClick={() => setMassSetOpen(true)}
						>
							<LuPencilLine
								size={16}
								aria-hidden="true"
								className="max-[359px]:hidden"
							/>
							{t("view.massSet")}
						</Button>
						<Button
							className="order-2 flex-1 lg:flex-none"
							onClick={() => setFiltersOpen(true)}
						>
							<LuListFilter
								size={16}
								aria-hidden="true"
								className="max-[359px]:hidden"
							/>
							{t("filters.title")}
							{activeFilters > 0 && (
								<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
									{activeFilters}
								</span>
							)}
						</Button>
						<div className="order-2 lg:order-2">
							<SegmentedControl
								label={t("view.layout.label")}
								options={[
									{
										id: "grid",
										label: t("view.layout.grid"),
										icon: <LuLayoutGrid size={16} aria-hidden="true" />,
									},
									{
										id: "tree",
										label: t("view.layout.tree"),
										icon: <LuNetwork size={16} aria-hidden="true" />,
									},
								]}
								value={layout}
								onChange={setLayout}
							/>
						</div>
						{options.length > 0 && (
							<Button
								className="order-4 w-full lg:order-3 lg:w-auto"
								onClick={() => setStartOpen(true)}
							>
								<LuPlay
									size={16}
									aria-hidden="true"
									className="max-[359px]:hidden"
								/>
								{tq("start.title")}
							</Button>
						)}
						<Button
							variant="primary"
							className="order-3 flex-1 lg:order-4 lg:flex-none"
							onClick={() => setPlanOpen(true)}
						>
							<LuClipboardList
								size={16}
								aria-hidden="true"
								className="max-[359px]:hidden"
							/>
							{t("view.plan")}
						</Button>
					</div>
				</div>
				<p role="status" className="text-muted">
					{layout === "tree"
						? t("view.status.tree", {
								count: formatNumber(tabViews.length),
								tab: tabName(tab),
								power: formatNumber(powerOfViews(tabViews)),
							})
						: t("view.status.grid", {
								shown: formatNumber(visible.length),
								count: formatNumber(tabViews.length),
								tab: tabName(tab),
								power: formatNumber(powerOfViews(tabViews)),
							})}
				</p>

				{layout === "tree" ? (
					<ResearchTree
						tabId={tab.id}
						views={tabViews}
						visibleIds={new Set(visible.map((item) => item.node.id))}
						onOpen={setOpenNodeId}
					/>
				) : visible.length === 0 ? (
					<EmptyState
						title={t("view.empty.title")}
						description={t("view.empty.description")}
						actions={
							<Button onClick={() => setFilters(defaultResearchFilters())}>
								{t("view.empty.reset")}
							</Button>
						}
					/>
				) : (
					<ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{visible.map((view) => (
							<NodeCard
								key={view.node.id}
								view={view}
								onLevelChange={(id, level) =>
									change((current) => withResearchLevel(current, id, level))
								}
								onOpen={setOpenNodeId}
								onManageJob={setManageQueue}
							/>
						))}
					</ul>
				)}
			</Tabs>

			<ResearchFiltersFlyout
				open={filtersOpen}
				tab={tab}
				filters={filters}
				shown={visible.length}
				onChange={setFilters}
				onReset={() => setFilters({ ...defaultResearchFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
			<ResearchMassSetDialog
				open={massSetOpen}
				chief={chief}
				tab={tab}
				onClose={() => setMassSetOpen(false)}
				onSave={saveMassSet}
			/>
			<StartUpgradeFlyout
				open={startOpen}
				chief={chief}
				description={t("view.start.description")}
				selectLabel={t("view.start.selectLabel")}
				selectHelp={t("view.start.selectHelp")}
				timeLabel={t("view.start.timeLabel")}
				speedLabel={t("view.start.speedLabel")}
				speedPercent={researchSpeedBonusPercent(chief)}
				slotLabel={t("view.start.slotLabel")}
				slotHelp={t("view.start.slotHelp")}
				slots={researchSlots(chief, now)}
				options={options}
				onClose={() => setStartOpen(false)}
				onStart={startUpgrade}
			/>
			<ManageUpgradeFlyout
				target={manageTarget}
				onClose={() => setManageQueue(null)}
				onSetSecondsLeft={(seconds) => {
					if (manageQueue === null) return;
					change((current) =>
						withJobEndsAt(
							current,
							{ kind: "research", queue: manageQueue },
							endsAtAfter(new Date(), seconds)
						)
					);
				}}
				onFinish={finishManaged}
				onCancel={cancelManaged}
			/>
			<NodeFlyout
				view={openView}
				chief={chief}
				onClose={() => setOpenNodeId(null)}
				onOpenPlan={() => {
					setOpenNodeId(null);
					setPlanOpen(true);
				}}
			/>
			<ResearchPlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
