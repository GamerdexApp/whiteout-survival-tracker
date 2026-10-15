"use client";

import type { BuffCategory, BuffGroupId } from "whiteout-survival-data";
import { useMemo, useState } from "react";
import { LuChevronDown, LuChevronRight, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { chiefBuffs, formatBuffValue } from "@/service/bonuses";
import { pendingSources, sourceTypeNames, unstoredSources } from "@/data/game/bonusSources";
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

const viewOptions: { id: View; label: string }[] = [
	{ id: "stat", label: "By stat" },
	{ id: "source", label: "By source" },
];

const rules = [
	{
		title: "Expert affinity",
		text: "An expert gives a base bonus that grows with the affinity level. At levels 10, 20 up to 100 the expert must advance. Until then the bonus of the level before counts.",
	},
	{
		title: "Albums count when complete",
		text: "A Tundra Album gives its buff only when all 9 puzzles are done.",
	},
	{
		title: "Pets use the refined value",
		text: "Each pet counts its normal or its refined value, as you set on the Pets page.",
	},
	{
		title: "No number, not counted",
		text: "A source that has no number in the data adds nothing. It is not shown as 0.",
	},
	{
		title: "Kept apart",
		text: "Percent and flat values are never added together. Infantry, Lancer and Marksman stats are separate from Troops stats.",
	},
	{
		title: "Time stats",
		text: "Construction Speed Boost is hours saved for each build. Ally Help Time is in seconds. Each shows its unit.",
	},
];

const joinNames = (names: string[]) =>
	names.length <= 1
		? (names[0] ?? "")
		: `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function BonusesView({ chief }: { chief: Playthrough }) {
	const buffs = useMemo(() => chiefBuffs(chief), [chief]);
	const [view, setView] = useState<View>("stat");
	const [search, setSearch] = useState("");
	const [groupId, setGroupId] = useState<"all" | BuffGroupId>("all");
	const [openStats, setOpenStats] = useState<Set<string>>(new Set());

	const query = search.trim().toLowerCase();
	const matches = (name: string) => name.toLowerCase().includes(query);
	const groupsWithStats = buffs.groups.filter((group) => group.categories.length > 0);

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

	const visibleSources = buffs.bySource
		.map((source) => ({
			...source,
			stats: source.stats.filter((stat) => matches(stat.name)),
		}))
		.filter((source) => source.stats.length > 0);

	const groupChips: { id: "all" | BuffGroupId; name: string; count: number }[] = [
		{ id: "all", name: "All", count: buffs.categories.length },
		...groupsWithStats.map((group) => ({
			id: group.id,
			name: group.name,
			count: group.categories.length,
		})),
	];

	const hasResults = view === "stat" ? visibleGroups.length > 0 : visibleSources.length > 0;

	return (
		<>
			<PageHeader
				title="Bonuses"
				subline={`${chief.name} · every bonus added up from the other pages. This page stores nothing.`}
			/>
			<div className="grid grid-cols-3 gap-2 lg:gap-3">
				<StatTile value={buffs.categories.length} label="Stats in the result" />
				<StatTile value={groupsWithStats.length} label="Groups with stats" />
				<StatTile value={buffs.bySource.length} label="Source types giving something" />
			</div>

			<Note tone="warning" title="Not every source is counted yet.">
				Each source below is read from the page that stores it. Until these pages are built
				they add nothing: {joinNames(pendingSources.map((source) => source.name))}.{" "}
				{joinNames(unstoredSources)} are not stored by any page yet.
			</Note>

			<Card className="flex flex-col gap-3 p-4">
				<h2 className="text-base font-semibold">How the numbers are counted</h2>
				<dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{rules.map((rule) => (
						<div key={rule.title} className="flex flex-col gap-0.5">
							<dt className="font-semibold">{rule.title}</dt>
							<dd className="text-muted">{rule.text}</dd>
						</div>
					))}
				</dl>
			</Card>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label="Search stats"
						placeholder="Search stats"
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<SegmentedControl
					label="View"
					options={viewOptions}
					value={view}
					onChange={setView}
				/>
			</div>

			{view === "stat" && (
				<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
					{groupChips.map((chip) => (
						<button
							key={chip.id}
							type="button"
							aria-pressed={groupId === chip.id}
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
					title={buffs.categories.length === 0 ? "No bonuses yet" : "No stats match"}
					description={
						buffs.categories.length === 0
							? "Bonuses appear as the pages that store them are filled in."
							: "Change the search or the group."
					}
				/>
			) : view === "stat" ? (
				<Card className="overflow-hidden">
					{visibleGroups.map((group) => (
						<section key={group.id} aria-label={group.name}>
							<div className="bg-tint flex items-baseline justify-between gap-3 px-4 py-2">
								<h2 className="font-semibold">{group.name}</h2>
								<span className="text-muted font-mono text-xs">
									{group.categories.length}{" "}
									{group.categories.length === 1 ? "stat" : "stats"}
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
						<Card key={source.id} className="overflow-hidden">
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
	const Chevron = open ? LuChevronDown : LuChevronRight;

	return (
		<li className="border-line border-t-[1.5px] first:border-t-0">
			<button
				type="button"
				aria-expanded={open}
				onClick={onToggle}
				className="hover:bg-tint flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left"
			>
				<Chevron size={16} aria-hidden="true" className="text-muted shrink-0" />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="font-semibold">{category.name}</span>
					<span className="text-muted text-xs">
						{category.sources.length}{" "}
						{category.sources.length === 1 ? "source" : "sources"}
					</span>
				</span>
				<span className="font-mono font-medium">
					{formatBuffValue(category.total, category.unit)}
				</span>
			</button>
			{open && (
				<div className="bg-surface">
					<div className="border-line text-muted hidden grid-cols-[1fr_12rem_6rem] gap-3 border-t-[1.5px] px-4 py-1 lg:grid">
						<SectionLabel>Stat and source</SectionLabel>
						<SectionLabel>Source type</SectionLabel>
						<SectionLabel className="text-right">Counted</SectionLabel>
					</div>
					<ul>
						{category.sources.map((source, index) => (
							<li
								key={`${source.type}-${source.id}-${index}`}
								className="border-line grid gap-x-3 gap-y-0.5 border-t-[1.5px] py-2 pr-4 pl-11 lg:grid-cols-[1fr_12rem_6rem]"
							>
								<span className="break-words">{source.label}</span>
								<span className="text-muted">{sourceTypeNames[source.type]}</span>
								<span className="font-mono lg:text-right">
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
