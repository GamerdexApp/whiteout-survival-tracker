"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import type { ExpertEventPointsRow } from "@/service/calcExpert";
import { eventPointRowsOf, hasProgress, sigilNeedsOf } from "@/service/calcExpert";
import { BOOK_ITEM_ID } from "@/data/game/calcExpert";
import type { ExpertCalculation, ExpertItemResult } from "@/data/game/calcExpert";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { StatTile } from "@/comps/ui/StatTile";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";

const learningTime = (minutes: number) => formatDuration(minutes * 60);

export function ExpertResults({ result }: { result: ExpertCalculation }) {
	const t = useTranslations("calcExpert.results");
	const tiles = [
		["books", formatNumber(result.books)],
		["sigils", formatNumber(result.sigils)],
		["exp", formatNumber(result.exp)],
		["learningTime", learningTime(result.learningMinutes)],
		["affinity", formatNumber(result.affinity)],
		["levels", formatNumber(result.levels)],
		["skillLevels", formatNumber(result.skillLevels)],
		["advancements", formatNumber(result.advancements)],
	] as const;

	return (
		<section className="flex flex-col gap-4" aria-labelledby="expert-calc-results">
			<h2 id="expert-calc-results" className="text-lg font-semibold">
				{t("title")}
			</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{tiles.map(([key, value]) => (
					<StatTile key={key} value={value} label={t(`stats.${key}`)} />
				))}
			</div>
			<ResourcesCard result={result} />
			<EventPoints result={result} />
			<ByExpert items={result.items.filter(hasProgress)} />
		</section>
	);
}

function ResourcesCard({ result }: { result: ExpertCalculation }) {
	const t = useTranslations("calcExpert.resources");
	const book = findItem(BOOK_ITEM_ID);
	const sigils = sigilNeedsOf(result);
	const entries = [
		...(result.books > 0
			? [{ key: BOOK_ITEM_ID, img: book?.img, name: book?.name, amount: result.books }]
			: []),
		...sigils.map((need) => {
			const item = need.itemId ? findItem(need.itemId) : undefined;
			return { key: need.expertId, img: item?.img, name: item?.name, amount: need.amount };
		}),
	];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			{entries.length === 0 ? (
				<p className="text-muted">{t("nothing")}</p>
			) : (
				<ul className="flex flex-col">
					{entries.map((entry) => (
						<li
							key={entry.key}
							className="border-line flex items-center gap-3 border-t-[1.5px] py-2 first:border-t-0"
						>
							<ItemIcon src={entry.img} size={32} />
							<span className="min-w-0 flex-1">{entry.name}</span>
							<span className="font-mono font-medium">
								{formatNumber(entry.amount)}
							</span>
						</li>
					))}
				</ul>
			)}
			{sigils.length > 0 && <p className="text-muted text-xs">{t("commonSigils")}</p>}
		</Card>
	);
}

function EventPoints({ result }: { result: ExpertCalculation }) {
	const t = useTranslations("calcExpert.events");
	const columns: StackColumn<ExpertEventPointsRow>[] = [
		{
			id: "event",
			header: t("heads.event"),
			width: "minmax(0,1.6fr)",
			render: (row) => <span className="font-medium">{row.name}</span>,
		},
		{
			id: "items",
			header: t("heads.items"),
			width: "minmax(0,1fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.itemPoints)}</span>,
		},
		{
			id: "perMinute",
			header: t("heads.perMinute"),
			width: "minmax(0,1fr)",
			render: (row) => (
				<span className="font-mono">{formatNumber(row.pointsPerSpeedupMinute)}</span>
			),
		},
		{
			id: "speedups",
			header: t("heads.speedups"),
			width: "minmax(0,1fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.speedupPoints)}</span>,
		},
		{
			id: "total",
			header: t("heads.total"),
			width: "minmax(0,1fr)",
			render: (row) => (
				<span className="font-mono font-semibold">{formatNumber(row.total)}</span>
			),
		},
	];

	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("title")}</h3>
			<StackTable
				label={t("title")}
				columns={columns}
				rows={eventPointRowsOf(result)}
				rowKey={(row) => row.id}
			/>
			<p className="text-muted text-xs">
				{t("hint", { duration: learningTime(result.learningMinutes) })}
			</p>
		</div>
	);
}

function ByExpert({ items }: { items: ExpertItemResult[] }) {
	const t = useTranslations("calcExpert.byExpert");
	const number = (value: number) => <span className="font-mono">{formatNumber(value)}</span>;
	const columns: StackColumn<ExpertItemResult>[] = [
		{
			id: "expert",
			header: t("heads.expert"),
			width: "minmax(0,1.4fr)",
			render: (item) => <span className="font-medium">{item.name}</span>,
		},
		{
			id: "levels",
			header: t("heads.levels"),
			width: "minmax(0,1fr)",
			render: (item) => number(item.levels),
		},
		{
			id: "advancements",
			header: t("heads.advancements"),
			width: "minmax(0,1fr)",
			render: (item) => number(item.advancements),
		},
		{
			id: "skillLevels",
			header: t("heads.skillLevels"),
			width: "minmax(0,1fr)",
			render: (item) => number(item.skillLevels),
		},
		{
			id: "books",
			header: t("heads.books"),
			width: "minmax(0,1fr)",
			render: (item) => number(item.books),
		},
		{
			id: "sigils",
			header: t("heads.sigils"),
			width: "minmax(0,1fr)",
			render: (item) => number(item.sigils),
		},
		{
			id: "exp",
			header: t("heads.exp"),
			width: "minmax(0,1.2fr)",
			render: (item) => number(item.exp),
		},
		{
			id: "learningTime",
			header: t("heads.learningTime"),
			width: "minmax(0,1.2fr)",
			render: (item) => (
				<span className="font-mono">{learningTime(item.learningMinutes)}</span>
			),
		},
		{
			id: "affinity",
			header: t("heads.affinity"),
			width: "minmax(0,1.2fr)",
			render: (item) => number(item.affinity),
		},
	];

	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("title")}</h3>
			{items.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("nothing")}</p>
				</Card>
			) : (
				<StackTable
					label={t("title")}
					columns={columns}
					rows={items}
					rowKey={(item) => item.id}
				/>
			)}
		</div>
	);
}
