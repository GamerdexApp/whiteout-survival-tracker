"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuClipboardList, LuListFilter, LuPlus, LuSearch } from "react-icons/lu";
import type { HeroGearPiece, HeroGearSlot, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import { unlockedHeroes } from "@/service/heroes";
import type {
	EditedSetValues,
	GearSetFilters,
	NewSetValues,
	PlanGoals,
	PlanPieceRef,
} from "@/service/heroGear";
import {
	countGearSetFilters,
	defaultGearSetFilters,
	enhancementLine,
	filterGearSets,
	gearSetsOf,
	resolvedGoal,
	setPower,
	slotIds,
	summarizeGear,
	troopLabel,
	withAddedSet,
	withDeletedSet,
	withEditedSet,
	withPieceChange,
	withPieceQuality,
	withSavedGearPlan,
} from "@/service/heroGear";
import { findHero } from "@/data/game/heroes";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
import { GearPieceCard } from "./GearPieceCard";
import { GearPlanFlyout } from "./GearPlanFlyout";
import { AddGearSetDialog, DeleteGearSetDialog, EditGearSetDialog } from "./GearSetDialogs";
import { GearSetFiltersFlyout } from "./GearSetFiltersFlyout";
import { GearStatLines } from "./GearStatLines";

export function HeroGearTab({ chief }: { chief: Playthrough }) {
	const t = useTranslations("heroGear.tab");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [filters, setFilters] = useState<GearSetFilters>(defaultGearSetFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [editing, setEditing] = useState<string | null>(null);
	const [planOpen, setPlanOpen] = useState(false);

	const sets = useMemo(() => gearSetsOf(chief), [chief]);
	const summary = useMemo(() => summarizeGear(sets), [sets]);
	const visible = filterGearSets(sets, filters);
	const selected = sets.find((set) => set.id === selectedId) ?? visible[0] ?? sets[0];
	const editingSet = sets.find((set) => set.id === editing) ?? null;
	const heroes = [...unlockedHeroes(chief)].sort((a, b) => a.name.localeCompare(b.name));
	const deletingSet = sets.find((set) => set.id === deleting) ?? null;

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const addSet = (values: NewSetValues) => {
		const id = crypto.randomUUID();
		if (!change((current) => withAddedSet(current, values, id))) return;
		setSelectedId(id);
		setAddOpen(false);
	};

	const editSet = (set: { id: string }, values: EditedSetValues) => {
		if (!change((current) => withEditedSet(current, set.id, values))) return;
		setEditing(null);
	};

	const deleteSet = () => {
		if (!deletingSet) return;
		const before = chief;
		if (!change((current) => withDeletedSet(current, deletingSet.id))) return;
		setDeleting(null);
		setSelectedId(null);
		showToast({
			variant: "warning",
			title: t("deletedTitle", { name: deletingSet.name }),
			message: t("deletedMessage"),
			action: { label: t("undo"), onAction: () => change(() => before) },
		});
	};

	const savePlan = (refs: PlanPieceRef[], goals: PlanGoals) => {
		change((current) => withSavedGearPlan(current, refs, goals, new Date().toISOString()));
	};

	const pieceGoal = (setId: string, slot: HeroGearSlot, piece: HeroGearPiece) =>
		resolvedGoal(piece, chief.heroGearPlan?.goals?.[setId]?.[slot]);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				<StatTile value={summary.sets} label={t("tiles.sets")} />
				<StatTile
					value={formatNumber(sets.reduce((total, set) => total + setPower(set), 0))}
					label={t("tiles.power")}
					emphasis
				/>
				<StatTile
					value={t("tiles.ofPieces", {
						count: formatNumber(summary.atEnhancementMax),
						total: formatNumber(summary.pieces),
					})}
					label={t("tiles.atEnhancementMax")}
				/>
				<StatTile
					value={t("tiles.ofPieces", {
						count: formatNumber(summary.empowered),
						total: formatNumber(summary.pieces),
					})}
					label={t("tiles.empowered")}
				/>
				<StatTile value={summary.readyForEmpowerment} label={t("tiles.ready")} />
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={t("search")}
						placeholder={t("search")}
						leadingIcon={<LuSearch size={16} />}
						value={filters.search}
						onChange={(event) => setFilters({ ...filters, search: event.target.value })}
					/>
				</div>
				<div className="flex w-full gap-3 lg:w-auto">
					<Button className="flex-1 lg:flex-none" onClick={() => setFiltersOpen(true)}>
						<LuListFilter size={16} aria-hidden="true" />
						{t("filters")}
						{countGearSetFilters(filters) > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{countGearSetFilters(filters)}
							</span>
						)}
					</Button>
					<Button
						variant="primary"
						className="flex-1 lg:flex-none"
						onClick={() => setPlanOpen(true)}
					>
						<LuClipboardList
							size={16}
							aria-hidden="true"
							className="max-[359px]:hidden"
						/>
						{t("plan")}
					</Button>
				</div>
			</div>
			<p role="status" className="text-muted">
				{t("showing", {
					shown: formatNumber(visible.length),
					total: formatNumber(sets.length),
				})}
			</p>

			{sets.length === 0 ? (
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<Button variant="primary" onClick={() => setAddOpen(true)}>
							{t("addSet")}
						</Button>
					}
				/>
			) : (
				<div className="grid items-start gap-4 lg:grid-cols-[17rem_1fr]">
					<div className="flex min-w-0 flex-col gap-2">
						<Button variant="link" className="w-full" onClick={() => setAddOpen(true)}>
							<LuPlus size={16} aria-hidden="true" />
							{t("addSet")}
						</Button>
						<ul className="flex gap-2 overflow-x-auto lg:flex-col">
							{visible.map((set) => (
								<li key={set.id} className="shrink-0 max-lg:w-56 lg:w-full">
									<button
										type="button"
										aria-pressed={set.id === selected?.id}
										onClick={() => setSelectedId(set.id)}
										className={`flex w-full flex-col gap-1 rounded-md border-[1.5px] p-3 text-left ${
											set.id === selected?.id
												? "border-primary bg-tint"
												: "border-line bg-surface"
										}`}
									>
										<span className="flex items-center justify-between gap-2">
											<span className="font-medium">{set.name}</span>
											<Badge tone="added">{troopLabel(set.troopType)}</Badge>
										</span>
										<span className="text-muted flex flex-wrap gap-x-2 text-xs">
											{set.heroId && (
												<>
													<span>
														{findHero(set.heroId)?.name ??
															t("unknownHero")}
													</span>
													<span aria-hidden="true">·</span>
												</>
											)}
											<span className="font-mono">
												{t("power", {
													amount: formatNumber(setPower(set)),
												})}
											</span>
										</span>
										<span className="text-muted font-mono text-xs">
											{t("enhancementLine", { line: enhancementLine(set) })}
										</span>
									</button>
								</li>
							))}
						</ul>
					</div>

					{selected && (
						<div className="flex min-w-0 flex-col gap-4">
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="text-lg font-semibold">{selected.name}</h2>
								<Badge tone="added">{troopLabel(selected.troopType)}</Badge>
								{selected.heroId && (
									<Badge tone="kept">
										{findHero(selected.heroId)?.name ?? t("unknownHero")}
									</Badge>
								)}
								<span className="text-muted">{t("troopHint")}</span>
								<span className="ml-auto flex gap-2">
									<Button onClick={() => setEditing(selected.id)}>
										{t("editSet")}
									</Button>
									<Button
										variant="danger"
										onClick={() => setDeleting(selected.id)}
									>
										{t("deleteSet")}
									</Button>
								</span>
							</div>
							<ul className="grid gap-3 xl:grid-cols-2">
								{slotIds.map((slot) => (
									<GearPieceCard
										key={slot}
										set={selected}
										slot={slot}
										goal={pieceGoal(selected.id, slot, selected.pieces[slot])}
										onChange={(patch) =>
											change((current) =>
												withPieceChange(current, selected.id, slot, patch)
											)
										}
										onQualityChange={(quality) =>
											change((current) =>
												withPieceQuality(
													current,
													selected.id,
													slot,
													quality
												)
											)
										}
									/>
								))}
							</ul>
							<GearStatLines set={selected} />
						</div>
					)}
				</div>
			)}

			<AddGearSetDialog
				open={addOpen}
				sets={sets}
				heroes={heroes}
				onClose={() => setAddOpen(false)}
				onAdd={addSet}
			/>
			<GearSetFiltersFlyout
				open={filtersOpen}
				filters={filters}
				shown={visible.length}
				onChange={setFilters}
				onReset={() => setFilters({ ...defaultGearSetFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
			<EditGearSetDialog
				set={editingSet}
				heroes={heroes}
				onClose={() => setEditing(null)}
				onSave={editSet}
			/>
			<DeleteGearSetDialog
				set={deletingSet}
				onClose={() => setDeleting(null)}
				onDelete={deleteSet}
			/>
			<GearPlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
