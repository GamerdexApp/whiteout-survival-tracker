"use client";

import type { BuffCategory, BuffGroupId } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuChevronDown, LuChevronRight, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { chiefBuffs, formatBuffValue, mergeResearchSources } from "@/service/bonuses";
import { unstoredSourceIds } from "@/data/game/bonusSources";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { StatTile } from "@/comps/ui/StatTile";
import { EventBuffRules } from "./EventBuffRules";

type View = "stat" | "source";

const views: View[] = ["stat", "source"];

const ruleIds = ["affinity", "albums", "pets", "noNumber", "apart", "time"] as const;

export function BonusesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("bonuses");
	const tv = useTranslations("bonuses.view");
	const buffs = useMemo(() => chiefBuffs(chief), [chief]);
	const [view, setView] = useState<View>("stat");
	const [search, setSearch] = useState("");
	const [groupId, setGroupId] = useState<"all" | BuffGroupId>("all");
	const [openStats, setOpenStats] = useState<Set<string>>(new Set());

	const sources = useMemo(() => mergeResearchSources(buffs.bySource), [buffs]);
	const query = search.trim().toLowerCase();
	const matches = (name: string) => name.toLowerCase().includes(query);
	const groupsWithStats = buffs.groups.filter((group) => group.categories.length > 0);

	const joinNames = (names: string[]) =>
		names.length <= 1
			? (names[0] ?? "")
			: t("list.andLast", {
					rest: names.slice(0, -1).join(t("list.separator")),
					last: names[names.length - 1],
				});

	const toggleStat = (key: string) =>
		setOpenStats((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	const visibleGroups = groupsWithStats
		.filter((group) => groupId === "all" || group.id === groupId)
		.map((group) => ({
			...group,
			categories: group.categories.filter((category) => matches(category.name)),
		}))
		.filter((group) => group.categories.length > 0);

	const visibleSources = sources
		.map((source) => ({
			...source,
			stats: source.stats.filter((stat) => matches(stat.name)),
		}))
		.filter((source) => source.stats.length > 0);

	const groupChips: { id: "all" | BuffGroupId; name: string; count: number }[] = [
		{ id: "all", name: t("all"), count: buffs.categories.length },
		...groupsWithStats.map((group) => ({
			id: group.id,
			name: group.name,
			count: group.categories.length,
		})),
	];

	const hasResults = view === "stat" ? visibleGroups.length > 0 : visibleSources.length > 0;

	return (
		<>
			<PageHeader title={t("title")} subline={tv("subline", { name: chief.name })} />
			<div className="grid grid-cols-3 gap-2 lg:gap-3">
				<StatTile value={buffs.categories.length} label={tv("tiles.stats")} />
				<StatTile value={groupsWithStats.length} label={tv("tiles.groups")} />
				<StatTile value={sources.length} label={tv("tiles.sources")} />
			</div>

			<Note title={tv("pending.title")}>
				{tv("pending.text", {
					unstored: joinNames(unstoredSourceIds.map((id) => t(`sourceTypes.${id}`))),
				})}
			</Note>

			<Card className="flex flex-col gap-3 p-4">
				<h2 className="text-base font-semibold">{tv("rulesTitle")}</h2>
				<dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{ruleIds.map((id) => (
						<div key={id} className="flex flex-col gap-0.5">
							<dt className="font-semibold">{tv(`rules.${id}.title`)}</dt>
							<dd className="text-muted">{tv(`rules.${id}.text`)}</dd>
						</div>
					))}
				</dl>
			</Card>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={tv("search.label")}
						placeholder={tv("search.placeholder")}
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<SegmentedControl
					label={tv("views.label")}
					options={views.map((id) => ({ id, label: tv(`views.${id}`) }))}
					value={view}
					onChange={setView}
				/>
			</div>

			{view === "stat" && (
				<div
					data-focus-inset
					className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
				>
					{groupChips.map((chip) => (
						<button
							key={chip.id}
							type="button"
							aria-pressed={groupId === chip.id}
							onFocus={(event) =>
								event.currentTarget.scrollIntoView({
									block: "nearest",
									inline: "nearest",
								})
							}
							onClick={() => setGroupId(chip.id)}
							className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3 whitespace-nowrap lg:min-h-9 ${
								groupId === chip.id
									? "border-primary bg-primary text-on-primary font-medium"
									: "border-line bg-surface hover:bg-tint"
							}`}
						>
							{chip.name}
							<span className="font-mono text-xs opacity-80">{chip.count}</span>
						</button>
					))}
				</div>
			)}

			{!hasResults ? (
				<EmptyState
					title={
						buffs.categories.length === 0
							? tv("empty.noBonusesTitle")
							: tv("empty.noMatchTitle")
					}
					description={
						buffs.categories.length === 0
							? tv("empty.noBonusesDescription")
							: tv("empty.noMatchDescription")
					}
				/>
			) : view === "stat" ? (
				<Card data-focus-inset className="overflow-hidden">
					{visibleGroups.map((group) => (
						<section key={group.id} aria-label={group.name}>
							<div className="bg-tint flex items-baseline justify-between gap-3 px-4 py-2">
								<h2 className="font-semibold">{group.name}</h2>
								<span className="text-muted font-mono text-xs">
									{tv("statCount", {
										count: group.categories.length,
										amount: formatNumber(group.categories.length),
									})}
								</span>
							</div>
							<ul>
								{group.categories.map((category) => (
									<StatRow
										key={`${category.statKey}-${category.unit}`}
										category={category}
										open={openStats.has(`${category.statKey}-${category.unit}`)}
										onToggle={() =>
											toggleStat(`${category.statKey}-${category.unit}`)
										}
									/>
								))}
							</ul>
						</section>
					))}
				</Card>
			) : (
				<div className="flex flex-col gap-3">
					{visibleSources.map((source) => (
						<Card key={source.id} data-focus-inset className="overflow-hidden">
							<div className="bg-tint px-4 py-2">
								<h2 className="font-semibold">{source.name}</h2>
							</div>
							<ul>
								{source.stats.map((stat) => (
									<li
										key={`${stat.statKey}-${stat.unit}`}
										className="border-line flex items-center justify-between gap-3 border-t-[1.5px] px-4 py-2 first:border-t-0"
									>
										<span>{stat.name}</span>
										<span className="font-mono font-medium">
											{formatBuffValue(stat.total, stat.unit)}
										</span>
									</li>
								))}
							</ul>
						</Card>
					))}
				</div>
			)}

			<EventBuffRules />
		</>
	);
}

function StatRow({
	category,
	open,
	onToggle,
}: {
	category: BuffCategory;
	open: boolean;
	onToggle: () => void;
}) {
	const t = useTranslations("bonuses");
	const tv = useTranslations("bonuses.view");
	const Chevron = open ? LuChevronDown : LuChevronRight;

	return (
		<li className="border-line border-t-[1.5px] first:border-t-0">
			<button
				type="button"
				aria-expanded={open}
				onClick={onToggle}
				className="hover:bg-tint flex min-h-12 w-full items-center gap-3 px-4 py-2 text-start"
			>
				<Chevron
					size={16}
					aria-hidden="true"
					className="text-muted shrink-0 rtl:-scale-x-100"
				/>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="font-semibold">{category.name}</span>
					<span className="text-muted text-xs">
						{tv("sourceCount", {
							count: category.sources.length,
							amount: formatNumber(category.sources.length),
						})}
					</span>
				</span>
				<span className="font-mono font-medium">
					{formatBuffValue(category.total, category.unit)}
				</span>
			</button>
			{open && (
				<div className="bg-surface">
					<div className="border-line text-muted hidden grid-cols-[1fr_12rem_6rem] gap-3 border-t-[1.5px] px-4 py-1 lg:grid">
						<SectionLabel>{tv("columns.statAndSource")}</SectionLabel>
						<SectionLabel>{tv("columns.sourceType")}</SectionLabel>
						<SectionLabel className="text-end">{tv("columns.counted")}</SectionLabel>
					</div>
					<ul>
						{category.sources.map((source, index) => (
							<li
								key={`${source.type}-${source.id}-${index}`}
								className="border-line grid gap-x-3 gap-y-0.5 border-t-[1.5px] py-2 ps-11 pe-4 lg:grid-cols-[1fr_12rem_6rem]"
							>
								<span className="wrap-break-word">{source.label}</span>
								<span className="text-muted">
									{t(`sourceTypes.${source.type}`)}
								</span>
								<span className="font-mono lg:text-end">
									{formatBuffValue(source.amount, category.unit)}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</li>
	);
}
