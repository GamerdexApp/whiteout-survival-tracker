"use client";

import { useMemo, useState } from "react";
import { LuListFilter, LuPencilLine, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
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
import { updateChiefById } from "@/service/chiefs";
import { buildingCategories, SHELTER_ID } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
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
				<Button onClick={() => setFiltersOpen(true)}>
					<LuListFilter size={16} aria-hidden="true" />
					Filters
					{activeFilterCount > 0 && (
						<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
							{activeFilterCount}
						</span>
					)}
				</Button>
				<Button onClick={() => setMassEditOpen(true)}>
					<LuPencilLine size={16} aria-hidden="true" />
					Mass edit
				</Button>
				<Button variant="primary" onClick={() => setPlanOpen(true)}>
					Plan
				</Button>
			</div>
			<p role="status" className="text-muted">
				Showing {shown} of {views.length} buildings. Goals are read only here and are set in
				Plan. A goal equal to the current level means no goal. Steppers move one level at a
				time along the game order.
			</p>
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
					change((current) => applyDraft(current, draft));
					setMassEditOpen(false);
					showToast({
						variant: "undo",
						title: "Mass edit applied",
						message: `${changeCount} ${changeCount === 1 ? "building" : "buildings"} updated.`,
						action: { label: "Undo", onAction: () => change(() => chief) },
					});
				}}
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
