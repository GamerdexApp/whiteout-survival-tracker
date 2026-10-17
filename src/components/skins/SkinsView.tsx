"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import {
	buildSkinViews,
	countSkinFilters,
	defaultSkinFilters,
	filterSkinViews,
	ownedBonusTotals,
	summarizeSkins,
	typeCounts,
	withSkinOwned,
} from "@/service/skins";
import type { SkinFilters } from "@/service/skins";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { SkinCard } from "./SkinCard";
import { SkinFiltersFlyout } from "./SkinFiltersFlyout";
import { BonusTotalsCard, ExpiryNote, OwnedTile } from "./SkinsSummary";

const MOBILE_PAGE_SIZE = 6;

export function SkinsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("skins");
	const { ui } = useUiSettings();
	const { updateData } = usePlaythrough();
	const isDesktop = useIsDesktop();
	const [filters, setFilters] = useState<SkinFilters>(defaultSkinFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [mobileShown, setMobileShown] = useState(MOBILE_PAGE_SIZE);

	const views = useMemo(() => buildSkinViews(chief), [chief]);
	const summary = useMemo(() => summarizeSkins(views), [views]);
	const totals = useMemo(() => ownedBonusTotals(views), [views]);
	const visible = useMemo(() => filterSkinViews(views, filters), [views, filters]);
	const shown = isDesktop ? visible : visible.slice(0, mobileShown);
	const activeFilterCount = countSkinFilters(filters);
	const activeFilterNames = [
		filters.skinType !== "all" ? filters.skinType : null,
		filters.owned !== "all" ? t(`filters.ownedOptions.${filters.owned}`) : null,
		filters.bonus !== "any" ? t(`filters.bonusOptions.${filters.bonus}`) : null,
		filters.order !== "game" ? t(`filters.orderOptions.${filters.order}`) : null,
	].filter((name) => name !== null);

	const changeFilters = (next: SkinFilters) => {
		setFilters(next);
		setMobileShown(MOBILE_PAGE_SIZE);
	};

	const setOwned = (id: string, owned: boolean) => {
		updateData((data) => updateChiefById(data, chief.id, (c) => withSkinOwned(c, id, owned)));
	};

	const counts = {
		shown: formatNumber(visible.length),
		total: formatNumber(views.length),
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
					owned: formatNumber(summary.owned),
					total: formatNumber(summary.total),
				})}
			/>

			<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
				<OwnedTile summary={summary} />
				<BonusTotalsCard totals={totals} summary={summary} />
			</div>
			<ExpiryNote />

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full min-w-0 lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={t("search.label")}
						placeholder={t("search.placeholder")}
						leadingIcon={<LuSearch size={16} />}
						value={filters.search}
						onChange={(event) =>
							changeFilters({ ...filters, search: event.target.value })
						}
					/>
				</div>
				<Button className="max-lg:flex-1" onClick={() => setFiltersOpen(true)}>
					<LuListFilter size={16} aria-hidden="true" />
					{t("filters.button")}
					{activeFilterCount > 0 && (
						<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
							{activeFilterCount}
						</span>
					)}
				</Button>
			</div>
			<p role="status" className="text-muted">
				{activeFilterNames.length > 0
					? t("status.showingFiltered", {
							...counts,
							filters: activeFilterNames.join(", "),
						})
					: t("status.showing", counts)}
			</p>

			{visible.length === 0 ? (
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<Button onClick={() => changeFilters(defaultSkinFilters())}>
							{t("empty.reset")}
						</Button>
					}
				/>
			) : (
				<>
					<ul className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
						{shown.map((view) => (
							<SkinCard
								key={view.skin.id}
								view={view}
								onOwned={(owned) => setOwned(view.skin.id, owned)}
							/>
						))}
					</ul>
					{visible.length > shown.length && (
						<Button
							className="w-full"
							onClick={() => setMobileShown(mobileShown + MOBILE_PAGE_SIZE)}
						>
							{t("status.showMore", {
								count: visible.length - shown.length,
								amount: formatNumber(visible.length - shown.length),
							})}
						</Button>
					)}
				</>
			)}

			<SkinFiltersFlyout
				open={filtersOpen}
				filters={filters}
				typeCounts={typeCounts(views)}
				total={views.length}
				shown={visible.length}
				onChange={changeFilters}
				onReset={() => changeFilters({ ...defaultSkinFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
		</>
	);
}
