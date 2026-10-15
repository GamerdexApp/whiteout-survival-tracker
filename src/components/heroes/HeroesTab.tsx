"use client";

import { useMemo, useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import type { HeroGoal, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import type { HeroChange } from "@/service/heroes";
import {
	applyHeroChange,
	buildHeroViews,
	countHeroFilters,
	defaultHeroFilters,
	filterHeroViews,
	maxOutTargets,
	summarizeHeroes,
	withMaxedHeroes,
	withSavedHeroesPlan,
} from "@/service/heroes";
import type { HeroFilters, MaxOutOptions } from "@/service/heroes";
import { gearSetsOf } from "@/service/heroGear";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
import { HeroCard } from "./HeroCard";
import { HeroFiltersFlyout } from "./HeroFiltersFlyout";
import { HeroFlyout } from "./HeroFlyout";
import { HeroMaxOutDialog } from "./HeroMaxOutDialog";
import { HeroPlanFlyout } from "./HeroPlanFlyout";

const PAGE_SIZE = 12;

export function HeroesTab({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [filters, setFilters] = useState<HeroFilters>(defaultHeroFilters);
	const [shownCount, setShownCount] = useState(PAGE_SIZE);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [openHeroId, setOpenHeroId] = useState<string | null>(null);
	const [maxOpen, setMaxOpen] = useState(false);
	const [planOpen, setPlanOpen] = useState(false);
	const [planHeroId, setPlanHeroId] = useState<string | null>(null);

	const views = useMemo(() => buildHeroViews(chief), [chief]);
	const summary = useMemo(() => summarizeHeroes(views, chief), [views, chief]);
	const visible = useMemo(() => filterHeroViews(views, filters), [views, filters]);
	const shown = visible.slice(0, shownCount);
	const gearSets = useMemo(() => gearSetsOf(chief), [chief]);
	const openView = views.find((view) => view.hero.id === openHeroId) ?? null;
	const generations = [...new Set(views.map((view) => view.hero.generation))];

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const changeFilters = (next: HeroFilters) => {
		setFilters(next);
		setShownCount(PAGE_SIZE);
	};

	const applyChange = (heroChange: HeroChange) => {
		const before = chief;
		if (!change((current) => applyHeroChange(current, heroChange))) return;
		if (heroChange.kind !== "owned" || heroChange.owned) return;
		const name = views.find((view) => view.hero.id === heroChange.heroId)?.hero.name;
		showToast({
			variant: "info",
			title: `${name} not owned`,
			message: "Its star, level and skills are kept for when you turn Owned on again.",
			action: { label: "Undo", onAction: () => change(() => before) },
		});
	};

	const applyMaxOut = (options: MaxOutOptions) => {
		const before = chief;
		const count = maxOutTargets(chief, options).length;
		if (!change((current) => withMaxedHeroes(current, options))) return;
		setMaxOpen(false);
		showToast({
			variant: "success",
			title: "Heroes maxed out",
			message: `${count} ${count === 1 ? "hero" : "heroes"} updated.`,
			action: { label: "Undo", onAction: () => change(() => before) },
		});
	};

	const openPlan = (heroId: string | null) => {
		setOpenHeroId(null);
		setPlanHeroId(heroId);
		setPlanOpen(true);
	};

	const savePlan = (goals: Record<string, HeroGoal>) => {
		change((current) => withSavedHeroesPlan(current, goals, new Date().toISOString()));
	};

	const activeFilters = countHeroFilters(filters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
				<StatTile
					value={`0 to ${summary.unlockedGenerations}`}
					label="Generations unlocked"
				/>
				<StatTile
					value={`${summary.owned} / ${summary.total}`}
					label="Heroes owned of those unlocked"
				/>
				<StatTile
					value={`${summary.legendaryOwned} / ${summary.legendaryTotal}`}
					label="Legendary owned of those unlocked"
				/>
				<StatTile value={summary.atMaxLevel} label="At level 80" />
				<StatTile
					value={formatNumber(summary.power)}
					label={
						summary.unknownPower === 0
							? "Hero power"
							: `Hero power, ${summary.unknownPower} Unknown left out`
					}
					emphasis
				/>
				<StatTile value={summary.withGoal} label="With a goal" emphasis />
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label="Search heroes"
						placeholder={`Search ${summary.total} heroes by name`}
						leadingIcon={<LuSearch size={16} />}
						value={filters.search}
						onChange={(event) =>
							changeFilters({ ...filters, search: event.target.value })
						}
					/>
				</div>
				<div className="flex w-full gap-3 lg:w-auto">
					<Button className="flex-1 lg:flex-none" onClick={() => setFiltersOpen(true)}>
						<LuListFilter size={16} aria-hidden="true" />
						Filters
						{activeFilters > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{activeFilters}
							</span>
						)}
					</Button>
					<Button className="flex-1 lg:flex-none" onClick={() => setMaxOpen(true)}>
						Max out
					</Button>
					<Button
						variant="primary"
						className="flex-1 lg:flex-none"
						onClick={() => openPlan(null)}
					>
						Plan
					</Button>
				</div>
			</div>
			<p role="status" className="text-muted">
				Showing {shown.length} of {visible.length} heroes. Generations 0 to{" "}
				{summary.unlockedGenerations} are unlocked on this chief. Goals are read only here
				and are set in Plan.
			</p>

			{visible.length === 0 ? (
				<EmptyState
					title="No heroes match"
					description="Change the search or reset the filters to see every hero."
					actions={
						<Button onClick={() => changeFilters(defaultHeroFilters())}>Reset</Button>
					}
				/>
			) : (
				<>
					<ul className="grid items-start gap-3 lg:grid-cols-2">
						{shown.map((view) => (
							<HeroCard
								key={view.hero.id}
								view={view}
								onChange={applyChange}
								onOpen={setOpenHeroId}
								onPlan={openPlan}
								gearSetNames={gearSets
									.filter((set) => set.heroId === view.hero.id)
									.map((set) => set.name)}
							/>
						))}
					</ul>
					{visible.length > shown.length && (
						<Button
							className="w-full"
							onClick={() => setShownCount(shownCount + PAGE_SIZE)}
						>
							Show more, {formatNumber(visible.length - shown.length)} more{" "}
							{visible.length - shown.length === 1 ? "hero" : "heroes"}
						</Button>
					)}
				</>
			)}

			<HeroFiltersFlyout
				open={filtersOpen}
				filters={filters}
				generations={generations}
				shown={visible.length}
				onChange={changeFilters}
				onReset={() => changeFilters({ ...defaultHeroFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
			<HeroMaxOutDialog
				open={maxOpen}
				chief={chief}
				onClose={() => setMaxOpen(false)}
				onApply={applyMaxOut}
			/>
			<HeroFlyout
				view={openView}
				chief={chief}
				onChange={applyChange}
				onPlan={openPlan}
				onClose={() => setOpenHeroId(null)}
			/>
			<HeroPlanFlyout
				open={planOpen}
				chief={chief}
				focusHeroId={planHeroId}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
