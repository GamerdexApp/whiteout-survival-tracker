"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuListFilter } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import {
	buildTechViews,
	countTech,
	countTechFilters,
	defaultTechFilters,
	filterTechViews,
	withTechLevel,
} from "@/service/allianceTech";
import type { TechFilters } from "@/service/allianceTech";
import { describeChief, updateChiefById } from "@/service/chiefs";
import { techCategories } from "@/data/game/alliance";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { StatTile } from "@/comps/ui/StatTile";
import { Tabs } from "@/comps/ui/Tabs";
import { TechFilterFields } from "./TechFilterFields";
import { TechFiltersFlyout } from "./TechFiltersFlyout";
import { TechNodeFlyout } from "./TechNodeFlyout";
import { TECH_ROW_GRID, TechRow } from "./TechRow";

export function TechView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("tech");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const [category, setCategory] = useUrlTab(techCategories, "Growth");
	const [filters, setFilters] = useState<TechFilters>(defaultTechFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [openNodeId, setOpenNodeId] = useState<string | null>(null);

	const views = useMemo(() => buildTechViews(chief), [chief]);
	const counts = useMemo(() => countTech(views), [views]);
	const visible = useMemo(
		() => filterTechViews(views, category, filters),
		[views, category, filters]
	);
	const inCategory = views.filter((view) => view.node.category === category).length;
	const activeFilters = countTechFilters(filters);

	const setLevel = (nodeId: string, level: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withTechLevel(current, nodeId, level))
		);
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: `${chief.name} · ${describeChief(chief, ui.furnaceFullLabels)}`,
					count: formatNumber(views.length),
				})}
			/>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile value={formatNumber(counts.maxed)} label={t("summary.maxed")} />
				<StatTile value={formatNumber(counts.inProgress)} label={t("summary.inProgress")} />
				<StatTile value={formatNumber(counts.notStarted)} label={t("summary.notStarted")} />
				<StatTile value={formatNumber(counts.locked)} label={t("summary.locked")} />
			</div>

			<Tabs
				label={t("tabs.label")}
				tabs={techCategories.map((id) => ({
					id,
					label: t(`categories.${id}`),
					count: views.filter((view) => view.node.category === id).length,
				}))}
				activeId={category}
				onChange={setCategory}
			>
				<div className="flex flex-wrap items-center gap-3">
					<TechFilterFields
						filters={filters}
						onChange={setFilters}
						className="flex flex-wrap items-center gap-4 max-lg:hidden"
					/>
					<Button className="w-full lg:hidden" onClick={() => setFiltersOpen(true)}>
						<LuListFilter size={16} aria-hidden="true" />
						{t("filters.button")}
						{activeFilters > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{activeFilters}
							</span>
						)}
					</Button>
					<span role="status" className="text-muted">
						{t("filters.shown", {
							shown: formatNumber(visible.length),
							total: formatNumber(inCategory),
						})}
					</span>
				</div>

				{visible.length === 0 ? (
					<EmptyState
						title={t("empty.title")}
						description={t("empty.description")}
						actions={
							<Button onClick={() => setFilters(defaultTechFilters())}>
								{t("filters.reset")}
							</Button>
						}
					/>
				) : (
					<Card className="overflow-hidden">
						<div
							aria-hidden="true"
							className={`border-line text-muted grid gap-x-4 border-b-[1.5px] px-4 py-2 font-mono text-xs uppercase max-lg:hidden ${TECH_ROW_GRID}`}
						>
							<span>{t("table.node")}</span>
							<span>{t("table.level")}</span>
							<span>{t("table.bonus")}</span>
							<span>{t("table.cost")}</span>
							<span>{t("table.time")}</span>
							<span>{t("table.needs")}</span>
						</div>
						<ul>
							{visible.map((view) => (
								<TechRow
									key={view.node.id}
									view={view}
									onLevelChange={setLevel}
									onOpen={setOpenNodeId}
								/>
							))}
						</ul>
					</Card>
				)}
			</Tabs>

			<TechFiltersFlyout
				open={filtersOpen}
				filters={filters}
				shown={visible.length}
				onChange={setFilters}
				onReset={() => setFilters(defaultTechFilters())}
				onClose={() => setFiltersOpen(false)}
			/>
			<TechNodeFlyout
				chief={chief}
				nodeId={openNodeId}
				onLevelChange={setLevel}
				onOpenNode={setOpenNodeId}
				onClose={() => setOpenNodeId(null)}
			/>
		</>
	);
}
