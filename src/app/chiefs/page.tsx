"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LuPlus, LuSearch } from "react-icons/lu";
import type { ChiefValues, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
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

const sortOptions: { id: SortKey; label: string }[] = [
	{ id: "lastModified", label: "Last modified" },
	{ id: "createdAt", label: "Date created" },
	{ id: "name", label: "Name" },
];

const compareBy: Record<SortKey, (a: Playthrough, b: Playthrough) => number> = {
	lastModified: (a, b) => b.lastModified.localeCompare(a.lastModified),
	createdAt: (a, b) => b.createdAt.localeCompare(a.createdAt),
	name: (a, b) => a.name.localeCompare(b.name),
};

const countLabel = (count: number) => `${count} ${count === 1 ? "chief" : "chiefs"}`;

function NewChiefButton() {
	return (
		<ButtonLink href="/chiefs?new=1" scroll={false} variant="primary">
			<LuPlus size={16} aria-hidden="true" />
			New chief
		</ButtonLink>
	);
}

function ChiefsContent() {
	const router = useRouter();
	const showToast = useToast();
	const isCreating = useSearchParams().get("new") === "1";
	const { appData, playthroughs, activePlaythrough, isLoaded, updateData, setActivePlaythrough } =
		usePlaythrough();
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("lastModified");
	const [editingChief, setEditingChief] = useState<Playthrough | null>(null);
	const [deletingChief, setDeletingChief] = useState<Playthrough | null>(null);

	const query = search.trim().toLowerCase();
	const visibleChiefs = playthroughs
		.filter((chief) => chief.name.toLowerCase().includes(query))
		.sort(compareBy[sortKey]);

	const closeCreateDialog = () => router.replace("/chiefs", { scroll: false });

	const createChief = (values: ChiefValues) => {
		updateData((current) => addChief(current, values));
		router.push("/overview");
	};

	const saveChief = (values: ChiefValues) => {
		if (!editingChief) return;
		updateData((current) => updateChief(current, editingChief.id, values));
		setEditingChief(null);
	};

	const exportBackup = () => {
		showToast({
			variant: "success",
			title: "Backup downloaded",
			message: downloadBackup(appData),
		});
	};

	const deleteChief = (chief: Playthrough) => {
		const wasActive = chief.id === appData.activePlaythroughId;
		updateData((current) => removeChief(current, chief.id));
		setDeletingChief(null);
		showToast({
			variant: "undo",
			title: `${chief.name} deleted`,
			action: {
				label: "Undo",
				onAction: () => updateData((current) => restoreChief(current, chief, wasActive)),
			},
		});
	};

	const subline = !isLoaded
		? undefined
		: playthroughs.length === 0
			? "No chiefs yet."
			: `${countLabel(playthroughs.length)}.${activePlaythrough ? ` ${activePlaythrough.name} is active.` : ""}`;

	return (
		<>
			<PageHeader title="Chiefs" subline={subline} actions={<NewChiefButton />} />

			{!isLoaded && (
				<>
					<p className="text-muted">
						Reading saved data from this browser. The list appears when it is ready.
					</p>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<Skeleton className="h-48" />
						<Skeleton className="h-48" />
						<Skeleton className="h-48" />
					</div>
				</>
			)}

			{isLoaded && playthroughs.length === 0 && (
				<EmptyState
					title="No chiefs yet"
					description="Create a chief to track buildings, heroes, gear, research and your upgrade plan. Everything stays in this browser."
					actions={
						<>
							<NewChiefButton />
							<ButtonLink href="/settings?tab=data">
								Restore a backup in Settings
							</ButtonLink>
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
								aria-label="Search by name"
								placeholder="Search by name"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>
						<label className="flex items-center gap-2 lg:w-64">
							<span className="text-muted shrink-0">Sort by</span>
							<div className="flex-1">
								<Select
									value={sortKey}
									onChange={(event) => setSortKey(event.target.value as SortKey)}
								>
									{sortOptions.map((option) => (
										<option key={option.id} value={option.id}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						</label>
					</div>
					<p role="status" className="text-muted">
						Showing {visibleChiefs.length} of {countLabel(playthroughs.length)}
					</p>

					{visibleChiefs.length === 0 ? (
						<EmptyState
							title={`No chiefs match “${search.trim()}”`}
							description={`Check the spelling or clear the search to see all ${playthroughs.length} chiefs.`}
							actions={<Button onClick={() => setSearch("")}>Clear search</Button>}
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
