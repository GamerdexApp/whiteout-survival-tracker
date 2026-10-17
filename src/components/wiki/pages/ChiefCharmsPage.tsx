"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatDecimal, formatNumber } from "@/lib/format";
import { matchesLadderSearch, summarizeLadder } from "@/service/wikiChiefGear";
import { charmConverter, charmLevels, charmSlotList } from "@/data/game/chiefGear";
import type { ChiefCharmLevel, ChiefCharmSlot } from "@/data/game/wikiChiefGear";
import { Card } from "@/comps/ui/Card";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { ExchangeRates } from "../chief/ExchangeRates";
import { LadderSummary } from "../chief/LadderSummary";
import { ResourceList } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { useGameLabels } from "../useGameLabels";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const levelSummaries = summarizeLadder(charmLevels, (row) => String(row.level));
const levelNumbers = levelSummaries.map((summary) => summary.key);
const stageNumbers = [...new Set(charmLevels.map((row) => row.stage))];

export function ChiefCharmsPage({ recordId }: WikiPageProps) {
	if (recordId === undefined) return <ChiefCharmsList />;

	const slot = charmSlotList.find((entry) => entry.id === recordId);
	if (!slot) return <WikiRecordMissing id="chiefCharms" />;

	return <ChiefCharmSlotRecord slot={slot} />;
}

function ChiefCharmSlotRecord({ slot }: { slot: ChiefCharmSlot }) {
	const t = useTranslations("wikiChiefCharms");
	const labels = useGameLabels();

	return (
		<WikiPageShell
			id="chiefCharms"
			recordName={labels.heroClass(slot.troopType)}
			line={t("slots.recordLine", { troopType: labels.heroClass(slot.troopType) })}
		>
			<ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
				{slot.images.map((image, index) => (
					<li key={image}>
						<Card className="flex h-full flex-col items-center gap-2 p-3">
							<ItemIcon src={image} size={56} />
							<span className="font-semibold">
								{t("levels.levelName", { level: formatNumber(index + 1) })}
							</span>
						</Card>
					</li>
				))}
			</ul>
		</WikiPageShell>
	);
}

function ChiefCharmsList() {
	const t = useTranslations("wikiChiefCharms");
	const labels = useGameLabels();
	const [search, setSearch] = useState("");
	const [level, setLevel] = useState("all");
	const [stage, setStage] = useState("all");

	const matches = charmLevels.filter(
		(row) =>
			(level === "all" || String(row.level) === level) &&
			(stage === "all" || String(row.stage) === stage) &&
			matchesLadderSearch([row.name], search)
	);

	const statsText = (row: ChiefCharmLevel) =>
		t("cells.percent", { value: formatDecimal(row.statTotalPercent) });

	const columns: StackColumn<ChiefCharmLevel>[] = [
		{
			id: "row",
			header: t("columns.row"),
			width: "minmax(0,1.2fr)",
			render: (row) => <span className="font-semibold">{row.name}</span>,
		},
		{
			id: "materials",
			header: t("columns.materials"),
			width: "minmax(0,2fr)",
			render: (row) => <ResourceList entries={row.materials} emptyText={t("cells.none")} />,
		},
		{ id: "stats", header: t("columns.stats"), width: "5rem", render: statsText },
		{
			id: "power",
			header: t("columns.power"),
			width: "6rem",
			render: (row) => formatNumber(row.powerTotal),
		},
		{
			id: "score",
			header: t("columns.score"),
			width: "4.5rem",
			render: (row) => formatNumber(row.score),
		},
	];

	return (
		<WikiPageShell
			id="chiefCharms"
			line={t("line", {
				rows: formatNumber(charmLevels.length),
				slots: formatNumber(charmSlotList.length),
				rates: formatNumber(charmConverter.length),
			})}
		>
			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("slots.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("slots.meta", { slots: formatNumber(charmSlotList.length) })}
					</span>
				</h2>
				<ul className="grid gap-3 lg:grid-cols-3">
					{charmSlotList.map((slot) => (
						<li key={slot.id}>
							<Link
								href={`/wiki/chief-charms/${encodeURIComponent(slot.id)}`}
								className="bg-surface border-line hover:border-primary flex h-full min-h-11 flex-col gap-2 rounded-md border-[1.5px] p-3"
							>
								<span className="font-semibold">
									{labels.heroClass(slot.troopType)}
								</span>
								<span className="flex flex-wrap gap-1">
									{slot.images.map((image) => (
										<ItemIcon key={image} src={image} size={24} />
									))}
								</span>
								<span className="text-muted text-xs">
									{t("slots.icons", {
										count: slot.images.length,
										amount: formatNumber(slot.images.length),
									})}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("table.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("table.meta", {
							rows: formatNumber(charmLevels.length),
							levels: formatNumber(levelNumbers.length),
						})}
					</span>
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
					<Input
						type="search"
						aria-label={t("table.searchLabel")}
						placeholder={t("table.searchPlaceholder", {
							rows: formatNumber(charmLevels.length),
						})}
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="sm:col-span-2 lg:col-span-1"
					/>
					<Select
						aria-label={t("table.levelLabel")}
						value={level}
						onChange={(event) => setLevel(event.target.value)}
					>
						<option value="all">{t("table.allLevels")}</option>
						{levelNumbers.map((value) => (
							<option key={value} value={value}>
								{t("table.levelOption", { level: formatNumber(Number(value)) })}
							</option>
						))}
					</Select>
					<Select
						aria-label={t("table.stageLabel")}
						value={stage}
						onChange={(event) => setStage(event.target.value)}
					>
						<option value="all">{t("table.allStages")}</option>
						{stageNumbers.map((value) => (
							<option key={value} value={String(value)}>
								{t("table.stageOption", { stage: formatNumber(value) })}
							</option>
						))}
					</Select>
				</div>
				{matches.length === 0 ? (
					<p className="text-muted">{t("table.empty")}</p>
				) : (
					<StackTable
						label={t("table.heading")}
						columns={columns}
						rows={matches}
						rowKey={(row) => row.id}
					/>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("levels.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{formatNumber(levelSummaries.length)}
					</span>
				</h2>
				<LadderSummary
					label={t("levels.heading")}
					headers={{
						group: t("levels.level"),
						rows: t("levels.rows"),
						stats: t("levels.stats"),
						power: t("levels.power"),
					}}
					groups={levelSummaries}
					groupName={(key) => t("levels.levelName", { level: formatNumber(Number(key)) })}
					statsRange={(first, last) => t("levels.statsRange", { first, last })}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">{t("exchange.heading")}</h2>
				<ExchangeRates
					label={t("exchange.heading")}
					headers={{
						exchange: t("exchange.exchange"),
						from: t("exchange.from"),
						to: t("exchange.to"),
						weeklyLimit: t("exchange.weeklyLimit"),
					}}
					rates={charmConverter}
				/>
			</section>
		</WikiPageShell>
	);
}
