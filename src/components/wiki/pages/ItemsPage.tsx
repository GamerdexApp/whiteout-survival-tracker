"use client";

import type { Item } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
	chestsWithLootRates,
	filterItems,
	hasLootRates,
	hasSources,
	itemsWithoutSources,
	NO_FILTERS,
} from "@/service/wikiItems";
import type { ItemFilters, LootRatesFilter, SourcesFilter } from "@/service/wikiItems";
import { allItems, itemCategories } from "@/data/game/items";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { DetailRows } from "../parts/DetailRows";
import { FilterChips } from "../parts/FilterChips";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const SOURCES_FILTER_IDS: SourcesFilter[] = ["any", "has", "none"];
const LOOT_FILTER_IDS: LootRatesFilter[] = ["any", "has"];

function SourcesValue({ item }: { item: Item }) {
	return hasSources(item) ? <>{item.sources.join(", ")}</> : <UnknownValue />;
}

function DescriptionValue({ item }: { item: Item }) {
	return item.description ? <>{item.description}</> : <UnknownValue />;
}

function LootRatesValue({ item }: { item: Item }) {
	const t = useTranslations("wikiItems.loot");

	if (hasLootRates(item)) return <span className="text-kept">{t("yes")}</span>;
	if (item.category === "Chest") return <>{t("no")}</>;
	return <span className="text-muted">{t("notChest")}</span>;
}

function ItemDetail({ item }: { item: Item }) {
	const t = useTranslations("wikiItems.detail");
	const tSpeedup = useTranslations("wikiItems.speedupType");
	const rates = item.rewardRates ?? [];

	return (
		<div className="flex flex-col gap-6">
			<RecordSection title={t("title")}>
				<DetailRows
					rows={[
						{
							label: t("name"),
							value: (
								<span className="flex items-center gap-2">
									<ItemIcon src={item.img} size={32} />
									{item.name}
								</span>
							),
						},
						{ label: t("category"), value: item.category },
						{ label: t("sources"), value: <SourcesValue item={item} /> },
						...(item.speedup
							? [
									{
										label: t("speedup"),
										value: t("speedupValue", {
											type: tSpeedup(item.speedup.type),
											minutes: formatNumber(item.speedup.minutes),
										}),
									},
								]
							: []),
						{ label: t("description"), value: <DescriptionValue item={item} /> },
						...(item.category === "Chest"
							? [
									{
										label: t("lootRates"),
										value: rates.length ? (
											t("lootRowsListed", {
												count: rates.length,
												amount: formatNumber(rates.length),
											})
										) : (
											<span className="text-muted italic">
												{t("noLootRates")}
											</span>
										),
									},
								]
							: []),
					]}
				/>
			</RecordSection>
			{rates.length > 0 && (
				<RecordSection
					title={t("lootTitle")}
					meta={t("lootMeta", {
						count: rates.length,
						amount: formatNumber(rates.length),
					})}
				>
					<ResponsiveTable
						label={t("lootTable")}
						titleColumnId="reward"
						rows={rates}
						rowKey={(row) => `${row.reward}-${row.amount}-${row.probabilityPercent}`}
						columns={[
							{ id: "reward", header: t("reward"), render: (row) => row.reward },
							{
								id: "amount",
								header: t("amount"),
								render: (row) => formatNumber(row.amount),
								numeric: true,
							},
							{
								id: "chance",
								header: t("chance"),
								render: (row) =>
									t("chanceValue", {
										percent: formatDecimal(row.probabilityPercent),
									}),
								numeric: true,
							},
						]}
					/>
				</RecordSection>
			)}
		</div>
	);
}

interface FilterControlsProps {
	filters: ItemFilters;
	onChange: (filters: ItemFilters) => void;
}

function CategoryChips({ filters, onChange }: FilterControlsProps) {
	const t = useTranslations("wikiItems.filters");

	return (
		<FilterChips
			label={t("category")}
			value={filters.category}
			onChange={(category) => onChange({ ...filters, category })}
			options={[
				{ id: "all", label: t("all"), count: allItems.length },
				...itemCategories.map(({ category, count }) => ({
					id: category,
					label: category,
					count,
				})),
			]}
		/>
	);
}

function FiltersSheet({
	open,
	filters,
	matchCount,
	onChange,
	onClose,
}: FilterControlsProps & { open: boolean; matchCount: number; onClose: () => void }) {
	const t = useTranslations("wikiItems.filters");
	const tSources = useTranslations("wikiItems.sourcesChip");
	const tLoot = useTranslations("wikiItems.lootChip");
	const amounts = {
		sources: formatNumber(itemsWithoutSources()),
		loot: formatNumber(chestsWithLootRates()),
	};

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			footer={
				<>
					<Button onClick={() => onChange(NO_FILTERS)}>{t("reset")}</Button>
					<Button variant="primary" onClick={onClose}>
						{t("show", { count: matchCount, amount: formatNumber(matchCount) })}
					</Button>
				</>
			}
		>
			<section className="flex flex-col gap-2">
				<h3 className="text-muted font-mono text-xs uppercase">{t("category")}</h3>
				<CategoryChips filters={filters} onChange={onChange} />
			</section>
			<section className="flex flex-col gap-2">
				<h3 className="text-muted font-mono text-xs uppercase">{t("sources")}</h3>
				<FilterChips
					label={t("sources")}
					value={filters.sources}
					onChange={(sources) => onChange({ ...filters, sources })}
					options={SOURCES_FILTER_IDS.map((id) => ({
						id,
						label: tSources(id, { amount: amounts.sources }),
					}))}
				/>
			</section>
			<section className="flex flex-col gap-2">
				<h3 className="text-muted font-mono text-xs uppercase">{t("lootRates")}</h3>
				<FilterChips
					label={t("lootRates")}
					value={filters.lootRates}
					onChange={(lootRates) => onChange({ ...filters, lootRates })}
					options={LOOT_FILTER_IDS.map((id) => ({
						id,
						label: tLoot(id, { amount: amounts.loot }),
					}))}
				/>
			</section>
		</Flyout>
	);
}

function CatalogCard() {
	const t = useTranslations("wikiItems.catalog");
	const tFilters = useTranslations("wikiItems.filters");
	const tSources = useTranslations("wikiItems.sourcesFilter");
	const tLoot = useTranslations("wikiItems.lootFilter");
	const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<Item>();

	const matches = filterItems(filters);

	return (
		<>
			<RecordSection
				title={t("title")}
				meta={t("showing", {
					shown: formatNumber(matches.length),
					total: formatNumber(allItems.length),
				})}
			>
				<RecordFilters>
					<Field label={t("search")}>
						<Input
							type="search"
							placeholder={t("searchPlaceholder")}
							leadingIcon={<LuSearch size={16} />}
							value={filters.query}
							onChange={(event) =>
								setFilters({ ...filters, query: event.target.value })
							}
						/>
					</Field>
					<div className="max-lg:hidden">
						<Field label={t("sources")}>
							<Select
								value={filters.sources}
								onChange={(event) =>
									setFilters({
										...filters,
										sources: event.target.value as SourcesFilter,
									})
								}
							>
								{SOURCES_FILTER_IDS.map((id) => (
									<option key={id} value={id}>
										{tSources(id)}
									</option>
								))}
							</Select>
						</Field>
					</div>
					<div className="max-lg:hidden">
						<Field label={t("lootRates")}>
							<Select
								value={filters.lootRates}
								onChange={(event) =>
									setFilters({
										...filters,
										lootRates: event.target.value as LootRatesFilter,
									})
								}
							>
								{LOOT_FILTER_IDS.map((id) => (
									<option key={id} value={id}>
										{tLoot(id)}
									</option>
								))}
							</Select>
						</Field>
					</div>
				</RecordFilters>
				<div className="hidden lg:block">
					<CategoryChips filters={filters} onChange={setFilters} />
				</div>
				<div className="border-line flex min-h-11 items-center justify-between gap-3 rounded-md border-[1.5px] px-3 lg:hidden">
					<span className="flex min-w-0 items-center gap-2">
						<LuListFilter size={16} aria-hidden="true" />
						{tFilters("summary", {
							category:
								filters.category === "all" ? tFilters("all") : filters.category,
							sources: tSources(filters.sources),
						})}
					</span>
					<Button variant="link" className="-mr-3" onClick={() => setSheetOpen(true)}>
						{tFilters("edit")}
					</Button>
				</div>
				{matches.length === 0 ? (
					<EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
				) : (
					<>
						<ResponsiveTable
							label={t("table")}
							titleColumnId="item"
							rows={matches}
							rowKey={(row) => row.id}
							onRowSelect={setSelectedItem}
							columns={[
								{
									id: "item",
									header: t("item"),
									render: (row) => (
										<span className="inline-flex items-center gap-2 lg:whitespace-nowrap">
											<ItemIcon src={row.img} size={32} />
											{row.name}
										</span>
									),
								},
								{
									id: "category",
									header: t("category"),
									width: "6rem",
									render: (row) => row.category,
								},
								{
									id: "sources",
									header: t("sources"),
									width: "9rem",
									render: (row) => (
										<span className="block lg:max-w-40">
											<SourcesValue item={row} />
										</span>
									),
								},
								{
									id: "loot",
									header: t("lootRates"),
									width: "5rem",
									render: (row) => <LootRatesValue item={row} />,
								},
								{
									id: "description",
									header: t("description"),
									render: (row) => (
										<span className="line-clamp-2">
											<DescriptionValue item={row} />
										</span>
									),
									wideOnCard: true,
								},
							]}
						/>
					</>
				)}
			</RecordSection>
			<Flyout
				open={selectedItem !== undefined}
				onClose={() => setSelectedItem(undefined)}
				title={selectedItem?.name ?? ""}
			>
				{selectedItem && <ItemDetail item={selectedItem} />}
			</Flyout>
			<FiltersSheet
				open={sheetOpen}
				filters={filters}
				matchCount={matches.length}
				onChange={setFilters}
				onClose={() => setSheetOpen(false)}
			/>
		</>
	);
}

export function ItemsPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiItems");

	if (recordId) return <WikiRecordMissing id="items" />;

	return (
		<WikiPageShell
			id="items"
			line={t("line", {
				items: formatNumber(allItems.length),
				categories: formatNumber(itemCategories.length),
				chests: formatNumber(chestsWithLootRates()),
			})}
		>
			<CatalogCard />
		</WikiPageShell>
	);
}
