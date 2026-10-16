"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { updateChiefById } from "@/service/chiefs";
import { describeChief } from "@/service/chiefs";
import type { PetChange, PetGoals } from "@/service/pets";
import {
	activePetFilters,
	applyPetChange,
	buildPetViews,
	countPetFilters,
	defaultPetFilters,
	filterPetViews,
	rarityCounts,
	summarizePets,
	troopTotals,
	unlockRuleMet,
	withSavedPetsPlan,
} from "@/service/pets";
import type { PetFilters } from "@/service/pets";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { useToast } from "@/comps/ui/Toast";
import { PetCard } from "./PetCard";
import { PetFiltersFlyout } from "./PetFiltersFlyout";
import { PetPlanFlyout } from "./PetPlanFlyout";
import { PetsSummaryTiles, PetsTroopTotals } from "./PetsSummary";

const MOBILE_PAGE_SIZE = 5;

export function PetsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("pets");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const { ui } = useUiSettings();
	const isDesktop = useIsDesktop();
	const now = useNow();
	const [filters, setFilters] = useState<PetFilters>(defaultPetFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [planOpen, setPlanOpen] = useState(false);
	const [mobileShown, setMobileShown] = useState(MOBILE_PAGE_SIZE);

	const views = useMemo(() => buildPetViews(chief), [chief]);
	const summary = useMemo(() => summarizePets(views), [views]);
	const totals = useMemo(() => troopTotals(views), [views]);
	const visible = useMemo(() => filterPetViews(views, filters), [views, filters]);
	const shown = isDesktop ? visible : visible.slice(0, mobileShown);
	const activeFilters = activePetFilters(filters);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const changeFilters = (next: PetFilters) => {
		setFilters(next);
		setMobileShown(MOBILE_PAGE_SIZE);
	};

	const applyChange = (petChange: PetChange) => {
		const before = chief;
		if (!change((current) => applyPetChange(current, petChange))) return;
		if (petChange.kind !== "unlocked" || petChange.unlocked) return;
		const name = views.find((view) => view.pet.id === petChange.petId)?.pet.name;
		if (!name) return;
		showToast({
			variant: "info",
			title: t("toast.lockedTitle", { name }),
			message: t("toast.lockedMessage"),
			action: { label: t("toast.undo"), onAction: () => change(() => before) },
		});
	};

	const savePlan = (goals: PetGoals) => {
		change((current) => withSavedPetsPlan(current, goals, new Date().toISOString()));
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
					unlocked: formatNumber(summary.unlocked),
					total: formatNumber(summary.total),
				})}
			/>
			<PetsSummaryTiles summary={summary} />
			<PetsTroopTotals totals={totals} />

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={t("search.label")}
						placeholder={t("search.placeholder", {
							amount: formatNumber(views.length),
						})}
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
						{t("filters.button")}
						{activeFilters.length > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{countPetFilters(filters)}
							</span>
						)}
					</Button>
					<Button
						variant="primary"
						className="flex-1 lg:flex-none"
						onClick={() => setPlanOpen(true)}
					>
						{t("plan.button")}
					</Button>
				</div>
			</div>
			<p role="status" className="text-muted">
				<span className="text-ink font-medium">
					{t("status.showing", {
						shown: formatNumber(shown.length),
						total: formatNumber(visible.length),
						count: visible.length,
					})}
					{activeFilters.length > 0 &&
						t("status.filters", {
							list: activeFilters
								.map((id) => t(`status.filterNames.${id}`))
								.join(", "),
						})}
				</span>{" "}
				{t("status.readOnlyGoals")}
			</p>

			{visible.length === 0 ? (
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<Button onClick={() => changeFilters(defaultPetFilters())}>
							{t("empty.reset")}
						</Button>
					}
				/>
			) : (
				<>
					<ul className="gap-3 lg:columns-2 xl:columns-3">
						{shown.map((view) => (
							<PetCard
								key={view.pet.id}
								view={view}
								chief={chief}
								ruleMet={
									!view.unlocked &&
									!view.locked &&
									unlockRuleMet(chief, view.pet, now)
								}
								onChange={applyChange}
							/>
						))}
					</ul>
					{visible.length > shown.length && (
						<Button
							className="w-full"
							onClick={() => setMobileShown(mobileShown + MOBILE_PAGE_SIZE * 2)}
						>
							{t("status.showMore", {
								count: visible.length - shown.length,
								amount: formatNumber(visible.length - shown.length),
							})}
						</Button>
					)}
				</>
			)}

			<PetFiltersFlyout
				open={filtersOpen}
				filters={filters}
				rarityCounts={rarityCounts(views)}
				total={views.length}
				shown={visible.length}
				onChange={changeFilters}
				onReset={() => changeFilters({ ...defaultPetFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
			<PetPlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
