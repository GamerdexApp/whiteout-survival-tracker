"use client";

import { useMemo, useState } from "react";
import { LuListFilter, LuPencilLine, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { constructionSpeedBonusPercent } from "@/service/bonuses";
import { applyDraft } from "@/service/buildingMassSet";
import { withSavedPlan } from "@/service/buildingPlan";
import type { BuildingFilters, BuildingView } from "@/service/buildings";
import {
	buildViews,
	countActiveFilters,
	defaultBuildingFilters,
	filterViews,
	summarize,
	withBuilt,
	withLevel,
	withShelterLevels,
} from "@/service/buildings";
import {
	builderSlots,
	canStartUpgrade,
	startConstruction,
	upgradeOptions,
} from "@/service/buildingUpgrades";
import { updateChiefById } from "@/service/chiefs";
import {
	builderJob,
	buildingJob,
	cancelJob,
	endsAtAfter,
	finishConstruction,
	withJobEndsAt,
} from "@/service/queues";
import type { StartPayload } from "@/service/queues";
import { buildingCategories, findBuildingById, SHELTER_ID } from "@/data/game/buildings";
import { ManageUpgradeFlyout } from "@/comps/queues/ManageUpgradeFlyout";
import type { ManageTarget } from "@/comps/queues/ManageUpgradeFlyout";
import { StartUpgradeFlyout } from "@/comps/queues/StartUpgradeFlyout";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
import { BuildersStrip } from "./BuildersStrip";
import { BuildingEntry, DESKTOP_COLUMNS } from "./BuildingEntry";
import { FiltersFlyout } from "./FiltersFlyout";
import { LevelsFlyout } from "./LevelsFlyout";
import { MassEditDialog } from "./MassEditDialog";
import { PlanFlyout } from "./PlanFlyout";
import { ShelterDialog } from "./ShelterDialog";

const TOTAL_LEVELLED = 18;
const TOTAL_ENTERTAINMENT = 9;

interface Group {
	label: string;
	views: BuildingView[];
}

export function BuildingsTab({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const { ui } = useUiSettings();
	const isDesktop = useIsDesktop();
	const [filters, setFilters] = useState<BuildingFilters>(() =>
		defaultBuildingFilters(ui.hideMaxed)
	);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [planOpen, setPlanOpen] = useState(false);
	const [levelsBuildingId, setLevelsBuildingId] = useState<string | null>(null);
	const [sheltersOpen, setSheltersOpen] = useState(false);
	const [massEditOpen, setMassEditOpen] = useState(false);
	const [startOpen, setStartOpen] = useState(false);
	const [startInitialId, setStartInitialId] = useState<string | undefined>();
	const [manageBuilder, setManageBuilder] = useState<number | null>(null);
	const now = useNow();

	const views = useMemo(() => buildViews(chief), [chief]);
	const summary = useMemo(() => summarize(views), [views]);
	const { pinned, rest, shown } = filterViews(views, filters);
	const levelsView = views.find((view) => view.building.id === levelsBuildingId) ?? null;

	const groups: Group[] = [
		{ label: "Pinned", views: pinned },
		...buildingCategories.map((category) => ({
			label: category,
			views: rest.filter((view) => view.building.category === category),
		})),
	].filter((group) => group.views.length > 0);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const activeFilterCount = countActiveFilters(filters, ui.hideMaxed);

	const options = useMemo(() => upgradeOptions(views, chief), [views, chief]);
	const openStart = (buildingId?: string) => {
		setStartInitialId(buildingId);
		setStartOpen(true);
	};

	const startUpgrade = (payload: StartPayload) => {
		const option = options.find((item) => item.id === payload.optionId);
		if (!option) return;
		if (!change((current) => startConstruction(current, option, payload))) return;
		setStartOpen(false);
		showToast({
			variant: "success",
			title: "Upgrade started",
			message: `${option.name}, ${option.subtitle}.`,
		});
	};

	const managedJob = manageBuilder === null ? undefined : builderJob(chief, manageBuilder);
	const managedName = managedJob
		? (findBuildingById(managedJob.buildingId)?.name ?? managedJob.buildingId)
		: "";
	const manageTarget: ManageTarget | null = managedJob
		? {
				title: managedName,
				summary: `${managedName}, ${managedJob.from ?? "Not built"} to ${managedJob.to}`,
				slotLabel: `Builder ${managedJob.builder}`,
				finishText: `Finish upgrade sets ${managedName} to ${managedJob.to}, frees Builder ${managedJob.builder} and adds the upgrade to your History. At zero time left the building and the builder card say Ready to finish. Nothing finishes by itself, because you may have used speedups.`,
				job: managedJob,
			}
		: null;

	const finishManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (!change((current) => finishConstruction(current, managedJob, new Date().toISOString())))
			return;
		setManageBuilder(null);
		showToast({
			variant: "success",
			title: `${managedName} upgraded`,
			message: `Now ${managedJob.to}. Added to History.`,
			action: { label: "Undo", onAction: () => change(() => before) },
		});
	};

	const cancelManaged = () => {
		if (!managedJob) return;
		const before = chief;
		if (
			!change((current) =>
				cancelJob(current, { kind: "construction", builder: managedJob.builder })
			)
		)
			return;
		setManageBuilder(null);
		showToast({
			variant: "warning",
			title: `${managedName} upgrade cancelled`,
			message: "The level stays as it was. Fix your stock on Resources if needed.",
			action: { label: "Undo", onAction: () => change(() => before) },
		});
	};

	return (
		<>
			<p className="text-muted">
				Current level and goal for every building. Furnace sets what the rest can reach.
			</p>
			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label="Search buildings"
						placeholder="Search buildings"
						leadingIcon={<LuSearch size={16} />}
						value={filters.search}
						onChange={(event) => setFilters({ ...filters, search: event.target.value })}
					/>
				</div>
				<div className="flex w-full flex-wrap gap-3 lg:w-auto lg:flex-nowrap">
					<Button
						className="order-1 flex-1 lg:flex-none"
						onClick={() => setFiltersOpen(true)}
					>
						<LuListFilter size={16} aria-hidden="true" className="max-[359px]:hidden" />
						Filters
						{activeFilterCount > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{activeFilterCount}
							</span>
						)}
					</Button>
					<Button
						className="order-2 flex-1 lg:flex-none"
						onClick={() => setMassEditOpen(true)}
					>
						<LuPencilLine size={16} aria-hidden="true" className="max-[359px]:hidden" />
						Mass edit
					</Button>
					{options.length > 0 && (
						<Button
							variant="secondary"
							className="order-4 w-full lg:order-3 lg:w-auto"
							onClick={() => openStart()}
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
				Showing {shown} of {views.length} buildings. Goals are read only here and are set in
				Plan. A goal equal to the current level means no goal. Steppers move one level at a
				time along the game order.
			</p>
			<BuildersStrip chief={chief} onManage={setManageBuilder} />
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<StatTile
					value={
						summary.furnaceLevel ? (
							formatFurnaceLevel(summary.furnaceLevel, ui.furnaceFullLabels)
						) : (
							<span className="text-muted">Unknown</span>
						)
					}
					label="Furnace, gates every other building"
				/>
				<StatTile
					value={formatNumber(summary.power)}
					label="Current power, all buildings"
					emphasis
				/>
				<StatTile
					value={formatNumber(summary.developmentIndex)}
					label="Development index, all buildings"
				/>
				<StatTile
					value={`${summary.withGoal} of ${TOTAL_LEVELLED}`}
					label="Buildings with a goal"
				/>
				<StatTile value={`${summary.atMax} of ${TOTAL_LEVELLED}`} label="At max level" />
				<StatTile
					value={`${summary.entertainmentBuilt} of ${TOTAL_ENTERTAINMENT}`}
					label="Entertainment built"
				/>
			</div>

			{shown === 0 ? (
				<EmptyState
					title="No buildings match"
					description="Change the search or reset the filters to see every building."
					actions={
						<Button onClick={() => setFilters(defaultBuildingFilters(ui.hideMaxed))}>
							Reset search and filters
						</Button>
					}
				/>
			) : (
				<Card className={isDesktop ? "overflow-hidden" : "border-0 bg-transparent"}>
					{isDesktop && (
						<div
							aria-hidden="true"
							className={`grid ${DESKTOP_COLUMNS} border-line gap-3 border-b-[1.5px] px-4 py-2`}
						>
							<SectionLabel className="text-muted">Building</SectionLabel>
							<SectionLabel className="text-muted">Current</SectionLabel>
							<SectionLabel className="text-muted">Goal</SectionLabel>
							<SectionLabel className="text-muted">Power</SectionLabel>
							<SectionLabel className="text-muted">
								Progress and next level
							</SectionLabel>
							<SectionLabel className="text-muted">Upgrade</SectionLabel>
							<span />
						</div>
					)}
					{groups.map((group) => (
						<section key={group.label} aria-label={group.label}>
							<div
								className={
									isDesktop
										? "bg-tint flex items-center justify-between px-4 py-2"
										: "flex items-center justify-between px-1 pt-4 pb-2"
								}
							>
								<h2 className="font-semibold">{group.label}</h2>
								<span className="text-muted font-mono text-xs">
									{group.views.length}
								</span>
							</div>
							<ul className={isDesktop ? "" : "flex flex-col gap-3"}>
								{group.views.map((view) => (
									<BuildingEntry
										key={view.building.id}
										view={view}
										onLevelChange={(id, level) =>
											change((current) => withLevel(current, id, level))
										}
										onBuiltChange={(id, built) =>
											change((current) => withBuilt(current, id, built))
										}
										onOpenLevels={setLevelsBuildingId}
										onOpenShelters={() => setSheltersOpen(true)}
										job={buildingJob(chief, view.building.id)}
										canStart={canStartUpgrade(view, chief)}
										onStartUpgrade={openStart}
										onManageUpgrade={setManageBuilder}
									/>
								))}
							</ul>
						</section>
					))}
				</Card>
			)}

			<FiltersFlyout
				open={filtersOpen}
				filters={filters}
				shown={shown}
				onChange={setFilters}
				onReset={() => setFilters(defaultBuildingFilters(ui.hideMaxed))}
				onClose={() => setFiltersOpen(false)}
			/>
			<MassEditDialog
				open={massEditOpen}
				chief={chief}
				onClose={() => setMassEditOpen(false)}
				onSave={(draft, changeCount) => {
					if (!change((current) => applyDraft(current, draft))) return;
					setMassEditOpen(false);
					showToast({
						variant: "success",
						title: "Mass edit applied",
						message: `${changeCount} ${changeCount === 1 ? "building" : "buildings"} updated.`,
						action: { label: "Undo", onAction: () => change(() => chief) },
					});
				}}
			/>
			<StartUpgradeFlyout
				open={startOpen}
				chief={chief}
				description="Mark a building as upgrading"
				selectLabel="Building to upgrade"
				selectHelp="Only buildings you can start now are listed. Locked, maxed and running buildings are left out. Each upgrade uses one of the two builders."
				timeLabel="Construction time"
				speedLabel="Construction speed"
				speedPercent={constructionSpeedBonusPercent(chief)}
				slotLabel="Builder"
				slotHelp="Pick an idle builder. A busy builder shows when it frees."
				slots={builderSlots(chief, now)}
				options={options}
				initialOptionId={startInitialId}
				onClose={() => setStartOpen(false)}
				onStart={startUpgrade}
			/>
			<ManageUpgradeFlyout
				target={manageTarget}
				onClose={() => setManageBuilder(null)}
				onSetSecondsLeft={(seconds) => {
					if (manageBuilder === null) return;
					change((current) =>
						withJobEndsAt(
							current,
							{ kind: "construction", builder: manageBuilder },
							endsAtAfter(new Date(), seconds)
						)
					);
				}}
				onFinish={finishManaged}
				onCancel={cancelManaged}
			/>
			<ShelterDialog
				open={sheltersOpen}
				chief={chief}
				locked={views.find((view) => view.building.id === SHELTER_ID)?.lockedBy != null}
				onClose={() => setSheltersOpen(false)}
				onChange={(levels) => change((current) => withShelterLevels(current, levels))}
			/>
			<LevelsFlyout view={levelsView} onClose={() => setLevelsBuildingId(null)} />
			<PlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={(rows, controls) =>
					change((current) =>
						withSavedPlan(current, rows, controls, new Date().toISOString())
					)
				}
			/>
		</>
	);
}
