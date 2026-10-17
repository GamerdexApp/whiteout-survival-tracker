"use client";

import type { Item, ItemCategory } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
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

const showFilters: ShowFilter[] = ["all", "owned", "unknown"];

export function ResourcesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("resources");
	const tv = useTranslations("resources.view");
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

	const joinNames = (names: string[]) =>
		names.length <= 1
			? (names[0] ?? "")
			: t("list.andLast", {
					rest: names.slice(0, -1).join(t("list.separator")),
					last: names[names.length - 1],
				});

	const setToZero = (item: Item) => {
		const previous = ownedCount(chief, item.id);
		if (!setCount(item.id, 0)) return;
		if (!editingSeveral) {
			showToast({
				variant: "warning",
				title: tv("toast.setToZero", { name: item.name }),
				action: { label: t("undo"), onAction: () => setCount(item.id, previous) },
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
			title: tv("toast.savedTitle"),
			message: tv("toast.savedMessage", { count, amount: formatNumber(count) }),
			action: {
				label: t("undo"),
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
	const sublineCounts = {
		items: formatNumber(allItems.length),
		categories: formatNumber(itemCategories.length),
	};
	const subline = inCategory
		? tv("sublineInCategory", {
				...sublineCounts,
				inCategory: formatNumber(inCategory),
				category,
			})
		: tv("subline", sublineCounts);

	return (
		<>
			<PageHeader
				title={t("title")}
				subline={subline}
				actions={
					unsavedCount > 0 ? (
						<span className="border-changed text-changed inline-flex h-8 items-center rounded-full border-[1.5px] px-3 text-xs font-medium">
							{tv("unsaved")}
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
					{tv("shortages", { names: joinNames(shortages) })}{" "}
					<Link href="/buildings" className="font-medium underline">
						{tv("shortagesLink")}
					</Link>
				</Note>
			)}

			<div
				data-focus-inset
				className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
			>
				{[{ category: "all" as const, count: allItems.length }, ...itemCategories].map(
					(entry) => {
						const active = category === entry.category;
						return (
							<button
								key={entry.category}
								type="button"
								aria-pressed={active}
								onFocus={(event) =>
									event.currentTarget.scrollIntoView({
										block: "nearest",
										inline: "nearest",
									})
								}
								onClick={() => setCategory(entry.category)}
								className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3 whitespace-nowrap lg:min-h-9 ${
									active
										? "border-primary bg-primary text-on-primary font-medium"
										: "border-line bg-surface hover:bg-tint"
								}`}
							>
								{entry.category === "all" ? t("all") : entry.category}
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
							<SectionLabel className="text-muted">
								{tv(`speedups.types.${stock.type}`)}
							</SectionLabel>
							<span className="font-mono text-lg font-medium">
								{stock.minutes === 0
									? tv("speedups.none")
									: formatDuration(stock.minutes * 60)}
							</span>
							<span className="text-muted text-xs">
								{stock.minutes === 0
									? tv("speedups.noneOwned")
									: tv("speedups.owned", {
											minutes: formatNumber(stock.minutes),
											parts: stock.parts
												.map((part) =>
													tv("speedups.part", {
														count: formatNumber(part.count),
														name: part.name,
													})
												)
												.join(tv("speedups.partSeparator")),
										})}
							</span>
						</Card>
					))}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={tv("search.label")}
						placeholder={tv("search.placeholder", {
							total: formatNumber(allItems.length),
						})}
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<SegmentedControl
					label={tv("show.label")}
					options={showFilters.map((id) => ({
						id,
						label: id === "all" ? t("all") : tv(`show.${id}`),
					}))}
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
					{tv("setSeveral")}
				</Button>
			</div>

			<p role="status" className="text-muted">
				{tv(editingSeveral ? "showing.several" : "showing.instant", {
					visible: formatNumber(visibleItems.length),
					total: formatNumber(allItems.length),
				})}
			</p>

			{visibleItems.length === 0 ? (
				<EmptyState
					title={tv("empty.title")}
					description={tv("empty.description")}
					actions={
						<Button
							onClick={() => {
								setSearch("");
								setShow("all");
								setCategory("all");
							}}
						>
							{tv("empty.reset")}
						</Button>
					}
				/>
			) : (
				<Card data-focus-inset className="overflow-hidden">
					{isDesktop && (
						<div
							aria-hidden="true"
							className={`border-line grid ${ITEM_COLUMNS} gap-3 border-b-[1.5px] px-4 py-2`}
						>
							<SectionLabel className="text-muted">{tv("columns.item")}</SectionLabel>
							<SectionLabel className="text-muted">{t("sources")}</SectionLabel>
							<SectionLabel className="text-muted text-right">
								{t("owned")}
							</SectionLabel>
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
							? tv("bar.noChanges")
							: tv("bar.changes", {
									count: unsavedCount,
									amount: formatNumber(unsavedCount),
								})}
					</span>
					<span className="flex gap-2">
						<Button
							onClick={() => {
								setDraft({});
								setEditingSeveral(false);
							}}
						>
							{unsavedCount === 0 ? t("done") : tv("bar.discard")}
						</Button>
						<Button variant="primary" disabled={unsavedCount === 0} onClick={saveDraft}>
							{tv("bar.save")}
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
