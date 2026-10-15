"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LuPlus, LuSearch } from "react-icons/lu";
import type { ChiefValues, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { downloadBackup } from "@/service/backup";
import { addChief, removeChief, restoreChief, updateChief } from "@/service/chiefs";
import { ChiefCard } from "@/comps/chiefs/ChiefCard";
import { ChiefDialog } from "@/comps/chiefs/ChiefDialog";
import { DeleteChiefDialog } from "@/comps/chiefs/DeleteChiefDialog";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { Skeleton } from "@/comps/ui/Skeleton";
import { useToast } from "@/comps/ui/Toast";

type SortKey = "lastModified" | "createdAt" | "name";

const sortKeys: SortKey[] = ["lastModified", "createdAt", "name"];

const compareBy: Record<SortKey, (a: Playthrough, b: Playthrough) => number> = {
	lastModified: (a, b) => b.lastModified.localeCompare(a.lastModified),
	createdAt: (a, b) => b.createdAt.localeCompare(a.createdAt),
	name: (a, b) => a.name.localeCompare(b.name),
};

function NewChiefButton() {
	const t = useTranslations("chiefs.page");
	return (
		<ButtonLink href="/chiefs?new=1" scroll={false} variant="primary">
			<LuPlus size={16} aria-hidden="true" />
			{t("newChief")}
		</ButtonLink>
	);
}

function ChiefsContent() {
	const t = useTranslations("chiefs.page");
	const tChiefs = useTranslations("chiefs");
	const router = useRouter();
	const showToast = useToast();
	const isCreating = useSearchParams().get("new") === "1";
	const { appData, playthroughs, activePlaythrough, isLoaded, updateData, setActivePlaythrough } =
		usePlaythrough();
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("lastModified");
	const [editingChief, setEditingChief] = useState<Playthrough | null>(null);
	const [deletingChief, setDeletingChief] = useState<Playthrough | null>(null);

	const countLabel = (count: number) => tChiefs("count", { count, amount: formatNumber(count) });

	const query = search.trim().toLowerCase();
	const visibleChiefs = playthroughs
		.filter((chief) => chief.name.toLowerCase().includes(query))
		.sort(compareBy[sortKey]);

	const closeCreateDialog = () => router.replace("/chiefs", { scroll: false });

	const createChief = (values: ChiefValues) => {
		if (!updateData((current) => addChief(current, values))) return;
		router.push("/overview");
	};

	const saveChief = (values: ChiefValues) => {
		if (!editingChief) return;
		if (!updateData((current) => updateChief(current, editingChief.id, values))) return;
		setEditingChief(null);
	};

	const exportBackup = () => {
		showToast({
			variant: "success",
			title: t("toasts.backupTitle"),
			message: downloadBackup(appData),
		});
	};

	const deleteChief = (chief: Playthrough) => {
		const wasActive = chief.id === appData.activePlaythroughId;
		if (!updateData((current) => removeChief(current, chief.id))) return;
		setDeletingChief(null);
		showToast({
			variant: "warning",
			title: t("toasts.deleted", { name: chief.name }),
			action: {
				label: t("toasts.undo"),
				onAction: () => updateData((current) => restoreChief(current, chief, wasActive)),
			},
		});
	};

	const subline = !isLoaded
		? undefined
		: playthroughs.length === 0
			? t("subline.none")
			: activePlaythrough
				? t("subline.withActive", {
						chiefs: countLabel(playthroughs.length),
						name: activePlaythrough.name,
					})
				: t("subline.total", { chiefs: countLabel(playthroughs.length) });

	return (
		<>
			<PageHeader title={t("title")} subline={subline} actions={<NewChiefButton />} />

			{!isLoaded && (
				<>
					<p className="text-muted">{t("loading")}</p>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<Skeleton className="h-48" />
						<Skeleton className="h-48" />
						<Skeleton className="h-48" />
					</div>
				</>
			)}

			{isLoaded && playthroughs.length === 0 && (
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<>
							<NewChiefButton />
							<ButtonLink href="/settings?tab=data">{t("empty.restore")}</ButtonLink>
						</>
					}
				/>
			)}

			{isLoaded && playthroughs.length > 0 && (
				<>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
						<div className="lg:flex-1">
							<Input
								leadingIcon={<LuSearch size={16} />}
								type="search"
								aria-label={t("search.label")}
								placeholder={t("search.label")}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>
						<label className="flex items-center gap-2 lg:w-64">
							<span className="text-muted shrink-0">{t("sort.label")}</span>
							<div className="flex-1">
								<Select
									value={sortKey}
									onChange={(event) => setSortKey(event.target.value as SortKey)}
								>
									{sortKeys.map((id) => (
										<option key={id} value={id}>
											{t(`sort.options.${id}`)}
										</option>
									))}
								</Select>
							</div>
						</label>
					</div>
					<p role="status" className="text-muted">
						{t("search.showing", {
							shown: formatNumber(visibleChiefs.length),
							total: countLabel(playthroughs.length),
						})}
					</p>

					{visibleChiefs.length === 0 ? (
						<EmptyState
							title={t("search.noMatchTitle", { search: search.trim() })}
							description={t("search.noMatchDescription", {
								count: formatNumber(playthroughs.length),
							})}
							actions={
								<Button onClick={() => setSearch("")}>{t("search.clear")}</Button>
							}
						/>
					) : (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{visibleChiefs.map((chief) => (
								<ChiefCard
									key={chief.id}
									chief={chief}
									isActive={chief.id === activePlaythrough?.id}
									onSetActive={() => setActivePlaythrough(chief.id)}
									onEdit={() => setEditingChief(chief)}
									onDelete={() => setDeletingChief(chief)}
								/>
							))}
						</div>
					)}
				</>
			)}

			<ChiefDialog
				open={isCreating}
				chief={null}
				onClose={closeCreateDialog}
				onSubmit={createChief}
			/>
			<ChiefDialog
				open={editingChief !== null}
				chief={editingChief}
				onClose={() => setEditingChief(null)}
				onSubmit={saveChief}
			/>
			<DeleteChiefDialog
				chief={deletingChief}
				onClose={() => setDeletingChief(null)}
				onExportBackup={exportBackup}
				onConfirm={deleteChief}
			/>
		</>
	);
}

export default function ChiefsPage() {
	return (
		<Suspense fallback={null}>
			<ChiefsContent />
		</Suspense>
	);
}
