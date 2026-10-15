"use client";

import type { Item, ItemCategory } from "whiteout-survival-data";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatCompact, formatDuration, formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { updateChiefById } from "@/service/chiefs";
import { ownedCount, speedupStock, withOwnedCount, withOwnedCounts } from "@/service/inventory";
import { plannerShortages } from "@/service/planStock";
import { allItems, findItem, itemCategories, STOCK_STRIP_ITEM_IDS } from "@/data/game/items";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { useToast } from "@/comps/ui/Toast";
import { ITEM_COLUMNS, ItemRow } from "./ItemRow";
import { ItemSheet } from "./ItemSheet";

type CategoryFilter = "all" | ItemCategory;
type ShowFilter = "all" | "owned" | "unknown";

const showOptions: { id: ShowFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "owned", label: "Owned" },
	{ id: "unknown", label: "Sources unknown" },
];

const joinNames = (names: string[]) =>
	names.length <= 1
		? (names[0] ?? "")
		: `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function ResourcesView({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const isDesktop = useIsDesktop();
	const [category, setCategory] = useState<CategoryFilter>("all");
	const [search, setSearch] = useState("");
	const [show, setShow] = useState<ShowFilter>("all");
	const [editingSeveral, setEditingSeveral] = useState(false);
	const [draft, setDraft] = useState<Record<string, number>>({});
	const [sheetItem, setSheetItem] = useState<Item | null>(null);

	const unsavedCount = Object.keys(draft).length;

	useEffect(() => {
		if (unsavedCount === 0) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [unsavedCount]);

	const countFor = (itemId: string) => draft[itemId] ?? ownedCount(chief, itemId);

	const setCount = (itemId: string, count: number): boolean => {
		if (editingSeveral) {
			setDraft((current) => {
				const next = { ...current, [itemId]: count };
				if (count === ownedCount(chief, itemId)) delete next[itemId];
				return next;
			});
			return true;
		}
		return (
			updateData((data) =>
				updateChiefById(data, chief.id, (current) => withOwnedCount(current, itemId, count))
			) !== null
		);
	};

	const setToZero = (item: Item) => {
		const previous = ownedCount(chief, item.id);
		if (!setCount(item.id, 0)) return;
		if (!editingSeveral) {
			showToast({
				variant: "warning",
				title: `${item.name} set to 0`,
				action: { label: "Undo", onAction: () => setCount(item.id, previous) },
			});
		}
	};

	const saveDraft = () => {
		const count = unsavedCount;
		const saved = updateData((data) =>
			updateChiefById(data, chief.id, (current) => withOwnedCounts(current, draft))
		);
		if (!saved) return;
		setDraft({});
		setEditingSeveral(false);
		showToast({
			variant: "success",
			title: "Counts saved",
			message: `${count} ${count === 1 ? "count" : "counts"} changed.`,
			action: {
				label: "Undo",
				onAction: () => updateData((data) => updateChiefById(data, chief.id, () => chief)),
			},
		});
	};

	const query = search.trim().toLowerCase();
	const visibleItems = useMemo(
		() =>
			allItems.filter(
				(item) =>
					(category === "all" || item.category === category) &&
					item.name.toLowerCase().includes(query) &&
					(show === "all" ||
						(show === "owned"
							? (draft[item.id] ?? ownedCount(chief, item.id)) > 0
							: item.sources.length === 0))
			),
		[category, query, show, chief, draft]
	);

	const shortages = useMemo(() => plannerShortages(chief), [chief]);
	const inCategory =
		category === "all"
			? null
			: itemCategories.find((entry) => entry.category === category)?.count;
	const subline = `${allItems.length} items in ${itemCategories.length} categories${
		inCategory ? ` · ${inCategory} in ${category}` : ""
	}`;

	return (
		<>
			<PageHeader
				title="Resources"
				subline={subline}
				actions={
					unsavedCount > 0 ? (
						<span className="border-changed text-changed inline-flex h-8 items-center rounded-full border-[1.5px] px-3 text-xs font-medium">
							Unsaved
						</span>
					) : undefined
				}
			/>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
				{STOCK_STRIP_ITEM_IDS.map((itemId) => (
					<Card key={itemId} className="flex flex-col gap-0.5 px-3 py-2">
						<SectionLabel className="text-muted">{findItem(itemId)?.name}</SectionLabel>
						<span className="font-mono text-lg font-medium">
							{formatCompact(countFor(itemId))}
						</span>
					</Card>
				))}
			</div>

			{shortages.length > 0 && (
				<Note tone="warning">
					Planner goals are short on {joinNames(shortages)}.{" "}
					<Link href="/buildings" className="font-medium underline">
						Open the Buildings plan
					</Link>
				</Note>
			)}

			<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
				{[{ category: "all" as const, count: allItems.length }, ...itemCategories].map(
					(entry) => {
						const active = category === entry.category;
						return (
							<button
								key={entry.category}
								type="button"
								aria-pressed={active}
								onClick={() => setCategory(entry.category)}
								className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3 whitespace-nowrap lg:min-h-9 ${
									active
										? "border-primary bg-primary text-on-primary font-medium"
										: "border-line bg-surface hover:bg-tint"
								}`}
							>
								{entry.category === "all" ? "All" : entry.category}
								<span className="font-mono text-xs opacity-80">{entry.count}</span>
							</button>
						);
					}
				)}
			</div>

			{category === "Speedups" && (
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
					{speedupStock(chief).map((stock) => (
						<Card key={stock.type} className="flex flex-col gap-0.5 px-3 py-2">
							<SectionLabel className="text-muted">{stock.label}</SectionLabel>
							<span className="font-mono text-lg font-medium">
								{stock.minutes === 0 ? "None" : formatDuration(stock.minutes * 60)}
							</span>
							<span className="text-muted text-xs">
								{stock.minutes === 0
									? "No speedups owned"
									: `${formatNumber(stock.minutes)} min: ${stock.parts
											.map(
												(part) =>
													`${formatNumber(part.count)} x ${part.name}`
											)
											.join(" + ")}`}
							</span>
						</Card>
					))}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label="Search items"
						placeholder={`Search ${allItems.length} items`}
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<SegmentedControl
					label="Show"
					options={showOptions}
					value={show}
					onChange={setShow}
				/>
				<Button
					variant={editingSeveral ? "primary" : "secondary"}
					aria-pressed={editingSeveral}
					className="flex-1 lg:flex-none"
					onClick={() => {
						if (editingSeveral && unsavedCount === 0) setEditingSeveral(false);
						else setEditingSeveral(true);
					}}
				>
					Set several
				</Button>
			</div>

			<p role="status" className="text-muted">
				Showing {visibleItems.length} of {allItems.length} items.
				{editingSeveral
					? " Set several is on. Changes wait until you press Save changes."
					: " Every change saves at once."}
			</p>

			{visibleItems.length === 0 ? (
				<EmptyState
					title="No items match"
					description="Change the search, the category or the Show filter."
					actions={
						<Button
							onClick={() => {
								setSearch("");
								setShow("all");
								setCategory("all");
							}}
						>
							Reset filters
						</Button>
					}
				/>
			) : (
				<Card className="overflow-hidden">
					{isDesktop && (
						<div
							aria-hidden="true"
							className={`border-line grid ${ITEM_COLUMNS} gap-3 border-b-[1.5px] px-4 py-2`}
						>
							<SectionLabel className="text-muted">Item</SectionLabel>
							<SectionLabel className="text-muted">Sources</SectionLabel>
							<SectionLabel className="text-muted text-right">Owned</SectionLabel>
						</div>
					)}
					<ul>
						{visibleItems.map((item) => (
							<ItemRow
								key={item.id}
								item={item}
								count={countFor(item.id)}
								changed={item.id in draft}
								onCountChange={setCount}
								onOpen={setSheetItem}
							/>
						))}
					</ul>
				</Card>
			)}

			{editingSeveral && (
				<div className="border-line bg-surface fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] px-4 py-3 lg:left-62">
					<span role="status" className="font-medium">
						{unsavedCount === 0
							? "No unsaved changes"
							: `${unsavedCount} unsaved ${unsavedCount === 1 ? "change" : "changes"}`}
					</span>
					<span className="flex gap-2">
						<Button
							onClick={() => {
								setDraft({});
								setEditingSeveral(false);
							}}
						>
							{unsavedCount === 0 ? "Done" : "Discard"}
						</Button>
						<Button variant="primary" disabled={unsavedCount === 0} onClick={saveDraft}>
							Save changes
						</Button>
					</span>
				</div>
			)}

			<ItemSheet
				item={sheetItem}
				count={sheetItem ? countFor(sheetItem.id) : 0}
				onCountChange={setCount}
				onSetToZero={setToZero}
				onClose={() => setSheetItem(null)}
			/>
		</>
	);
}
