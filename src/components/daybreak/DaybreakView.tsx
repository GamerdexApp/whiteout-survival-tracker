"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { updateChiefById } from "@/service/chiefs";
import {
	buildDecorationViews,
	buildLumberCampView,
	buildTreeOfLifeView,
	categoryCounts,
	chiefFurnaceLevel,
	countDecorationFilters,
	countOwned,
	defaultDecorationFilters,
	filterDecorationViews,
	furnaceLevelsMissing,
	isCounted,
	islandUnlocked,
	summarizeProsperity,
	unlockFurnaceLabel,
	withDecoration,
	withLumberCamp,
	withTreeOfLife,
} from "@/service/daybreak";
import type { DecorationFilters, DecorationView } from "@/service/daybreak";
import { ownedCount, withOwnedCount } from "@/service/inventory";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { DaybreakFiltersFlyout } from "./DaybreakFiltersFlyout";
import { DecorationCard } from "./DecorationCard";
import { LumberCampCard, TreeOfLifeCard } from "./IslandCards";
import { LifeEssenceCard } from "./LifeEssenceCard";
import { LockedBanner } from "./LockedBanner";
import { ProsperityTile } from "./ProsperityTile";

const MOBILE_PAGE_SIZE = 8;

export function DaybreakView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("daybreak");
	const { updateData } = usePlaythrough();
	const isDesktop = useIsDesktop();
	const [filters, setFilters] = useState<DecorationFilters>(defaultDecorationFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [mobileShown, setMobileShown] = useState(MOBILE_PAGE_SIZE);

	const unlocked = islandUnlocked(chief);
	const campView = buildLumberCampView(chief);
	const treeView = buildTreeOfLifeView(chief);
	const views = useMemo(() => buildDecorationViews(chief), [chief]);
	const prosperity = useMemo(() => summarizeProsperity(views), [views]);
	const visible = useMemo(() => filterDecorationViews(views, filters), [views, filters]);
	const shown = isDesktop ? visible : visible.slice(0, mobileShown);
	const withImage = views.filter((view) => view.decoration.img).length;
	const activeFilterCount = countDecorationFilters(filters);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const changeFilters = (next: DecorationFilters) => {
		setFilters(next);
		setMobileShown(MOBILE_PAGE_SIZE);
	};

	const setOwned = (view: DecorationView, owned: boolean) => {
		const id = view.decoration.id;
		if (!owned) {
			change((current) => withDecoration(current, id, { owned: false }));
			return;
		}
		change((current) =>
			withDecoration(current, id, {
				owned: true,
				...(isCounted(view.decoration) ? { count: view.count || 1 } : {}),
				...(view.maxLevel > 0 ? { level: view.level } : {}),
			})
		);
	};

	return (
		<>
			<PageHeader title={t("page.title")} subline={t("view.subline")} />
			{!unlocked && (
				<LockedBanner
					unlockLevel={unlockFurnaceLabel}
					currentLevel={chiefFurnaceLevel(chief)}
					missing={furnaceLevelsMissing(chief)}
				/>
			)}

			<ProsperityTile summary={prosperity} />

			<LifeEssenceCard
				count={ownedCount(chief, "life-essence")}
				onChange={(count) =>
					change((current) => withOwnedCount(current, "life-essence", count))
				}
			/>

			<div className="grid gap-3 lg:grid-cols-2">
				<LumberCampCard
					view={campView}
					locked={!unlocked}
					onLevel={(level) => change((current) => withLumberCamp(current, level))}
				/>
				<TreeOfLifeCard
					view={treeView}
					locked={!unlocked}
					onLevel={(level) => change((current) => withTreeOfLife(current, level))}
				/>
			</div>

			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-lg font-semibold">{t("decorations.title")}</h2>
				<span className="text-muted font-mono text-xs">
					{t("decorations.owned", {
						owned: formatNumber(countOwned(views)),
						total: formatNumber(views.length),
					})}
				</span>
			</div>
			{!isDesktop && (
				<Note>
					{t("decorations.imageNote", {
						withImage: formatNumber(withImage),
						total: formatNumber(views.length),
					})}
				</Note>
			)}

			<div className="flex items-center gap-3">
				<div className="min-w-0 flex-1">
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
				<Button onClick={() => setFiltersOpen(true)}>
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
				{t("status.showing", {
					shown: formatNumber(visible.length),
					total: formatNumber(views.length),
				})}
			</p>

			{visible.length === 0 ? (
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<Button onClick={() => changeFilters(defaultDecorationFilters())}>
							{t("empty.reset")}
						</Button>
					}
				/>
			) : (
				<>
					<ul className="gap-3 lg:columns-2 xl:columns-3">
						{shown.map((view) => (
							<DecorationCard
								key={view.decoration.id}
								view={view}
								locked={!unlocked}
								onOwned={(owned) => setOwned(view, owned)}
								onLevel={(level) =>
									change((current) =>
										withDecoration(current, view.decoration.id, { level })
									)
								}
								onCount={(count) =>
									change((current) =>
										withDecoration(current, view.decoration.id, { count })
									)
								}
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

			<DaybreakFiltersFlyout
				open={filtersOpen}
				filters={filters}
				categoryCounts={categoryCounts(views)}
				total={views.length}
				shown={visible.length}
				onChange={changeFilters}
				onReset={() =>
					changeFilters({ ...defaultDecorationFilters(), search: filters.search })
				}
				onClose={() => setFiltersOpen(false)}
			/>
		</>
	);
}
