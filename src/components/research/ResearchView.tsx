"use client";

import { useMemo, useState } from "react";
import { LuLayoutGrid, LuListFilter, LuNetwork, LuSearch } from "react-icons/lu";
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
import { researchTabs } from "@/data/game/research";
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
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [tabId, setTabId] = useState(researchTabs[0].id);
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
			title: "Mass set applied",
			message: `${plan.changes.length} ${plan.changes.length === 1 ? "node" : "nodes"} updated.`,
			action: { label: "Undo", onAction: () => change(() => before) },
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
			title: "Research started",
			message: `${option.name}, level ${option.from} to ${option.to}.`,
		});
	};

	const managedJob = manageQueue === null ? undefined : queueJob(chief, manageQueue);
	const managedNode = managedJob ? findResearch(managedJob.nodeId) : undefined;
	const managedName = managedNode?.name ?? managedJob?.nodeId ?? "";
	const manageTarget: ManageTarget | null =
		managedJob && managedNode
			? {
					title: managedName,
					summary: `${managedName}, level ${managedJob.from} to ${managedJob.to}`,
					slotLabel: `${managedJob.queue === "main" ? "Research queue" : "War Academy queue"}, ${managedNode.category}`,
					finishText: `Finish upgrade sets ${managedName} to level ${managedJob.to}, frees the ${managedJob.queue === "main" ? "Research" : "War Academy"} queue and adds the upgrade to your History. At zero time left the node and the queue card say Ready to finish. Nothing finishes by itself, because you may have used speedups.`,
					job: managedJob,
				}
			: null;

	const finishManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (!change((current) => finishResearch(current, managedJob, new Date().toISOString())))
			return;
		setManageQueue(null);
		showToast({
			variant: "success",
			title: `${managedName} researched`,
			message: `Now level ${managedJob.to}. Added to History.`,
			action: { label: "Undo", onAction: () => change(() => before) },
		});
	};

	const cancelManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (!change((current) => cancelJob(current, { kind: "research", queue: managedJob.queue })))
			return;
		setManageQueue(null);
		showToast({
			variant: "warning",
			title: `${managedName} research cancelled`,
			message: "The level stays as it was. Fix your stock on Resources if needed.",
			action: { label: "Undo", onAction: () => change(() => before) },
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
		`Research Center ${buildingLevel("research-center") ?? "Unknown"}`,
		`War Academy ${buildingLevel("war-academy") ?? "Unknown"}`,
	].join(" · ");

	const activeFilters = countResearchFilters(filters);

	return (
		<>
			<PageHeader title="Research" subline={subline} />
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={`${summary.maxed} of ${summary.total}`}
					label={`Nodes maxed, ${Math.round((summary.maxed / summary.total) * 100)}% of the tree`}
				/>
				<StatTile
					value={formatNumber(summary.power)}
					label="Research power, the power of every researched level"
					emphasis
				/>
				<StatTile
					value={`${summary.withoutTime} ${summary.withoutTime === 1 ? "node" : "nodes"}`}
					label={
						summary.withoutTime === 0
							? "Without research time, every level has one"
							: "Without research time, shown as Unknown"
					}
				/>
				<StatTile
					value={`${summary.locked} of ${summary.total}`}
					label="Locked by server age or requirements"
				/>
			</div>

			<QueuesStrip chief={chief} onManage={setManageQueue} />

			<Tabs
				label="Research"
				tabs={researchTabs.map((item) => ({
					id: item.id,
					label: item.name,
					count: nodesOfTabCount(item),
					locked: tabLockOf(item, chief) !== null,
				}))}
				activeId={tabId}
				onChange={switchTab}
			>
				{tabLock && (
					<Note tone="warning">
						{tabLockText(tab, tabLock)} You can still set goals in Plan.
					</Note>
				)}
				{!tabLock && lockedByRequirement > 0 && (
					<Note>
						{lockedByRequirement} of {tabViews.length} nodes in this tab are locked by a
						requirement.
					</Note>
				)}

				<div className="flex flex-wrap items-center gap-3">
					<div className="w-full lg:w-auto lg:flex-1">
						<Input
							type="search"
							aria-label="Search nodes"
							placeholder="Search nodes by name or bonus"
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
							Mass set
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
							Filters
							{activeFilters > 0 && (
								<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
									{activeFilters}
								</span>
							)}
						</Button>
						<div className="order-2 lg:order-2">
							<SegmentedControl
								label="Layout"
								options={[
									{ id: "grid", label: "Grid" },
									{ id: "tree", label: "Tree" },
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
								Start upgrade
							</Button>
						)}
						<Button
							variant="primary"
							className="order-3 flex-1 lg:order-4 lg:flex-none"
							onClick={() => setPlanOpen(true)}
						>
							Plan
						</Button>
					</div>
				</div>
				<p role="status" className="text-muted">
					{layout === "tree"
						? `${tabViews.length} nodes in the ${tab.name} tree. Scroll to pan. Nodes that do not match the search or filters are dimmed.`
						: `Showing ${visible.length} of ${tabViews.length} ${tab.name} nodes. Goals are read only here and are set in Plan.`}
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
						title="No nodes match"
						description="Change the search or reset the filters to see every node."
						actions={
							<Button onClick={() => setFilters(defaultResearchFilters())}>
								Reset search and filters
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
				description="Mark a research as upgrading"
				selectLabel="Research to upgrade"
				selectHelp="Only research you can start now is listed. Locked, maxed and running research is left out. A Growth, Economy or Battle research uses the Research queue. A T11 or T12 research uses the War Academy queue."
				timeLabel="Research time"
				speedLabel="Research speed"
				speedPercent={researchSpeedBonusPercent(chief)}
				slotLabel="Queue"
				slotHelp="One research at a time in each queue. When the queue is busy this card says when it frees."
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
