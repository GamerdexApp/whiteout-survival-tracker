"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { EventResultState, Playthrough } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import { MONTH_IDS, shortDayText } from "@/service/eventsFormat";
import {
	historyRowsOf,
	scoreOfResult,
	scoreUnitOf,
	starChangeOf,
	summarizeTrend,
	targetsOf,
	trendPointsOf,
} from "@/service/eventsResults";
import type { HistoryPeriod, HistoryRow, TrendMetric } from "@/service/eventsResults";
import { zoneParts } from "@/service/eventsSchedule";
import type { EventsZone } from "@/service/eventsSchedule";
import { allGameEvents, gameEventById } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { IconSelect } from "@/comps/ui/IconSelect";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { CATEGORY_BAR } from "./eventStyle";
import { TrendChart } from "./TrendChart";

const PAGE_SIZE = 16;

interface HistoryTabProps {
	chief: Playthrough;
	zone: EventsZone;
	nowMs: number;
	onEdit: (resultId: string) => void;
}

export function HistoryTab({ chief, zone, nowMs, onEdit }: HistoryTabProps) {
	const t = useTranslations("events");
	const [eventId, setEventId] = useState("all");
	const [period, setPeriod] = useState<HistoryPeriod>("all");
	const [metricChoice, setMetricChoice] = useState<TrendMetric>("score");
	const [shown, setShown] = useState(PAGE_SIZE);

	const results = chief.eventResults ?? [];
	const events = allGameEvents();
	const withResults = events.filter((event) =>
		results.some((result) => result.eventId === event.id)
	);
	const selected = withResults.some((event) => event.id === eventId) ? eventId : "all";
	const rows = historyRowsOf(results, events, selected, period, nowMs);
	const visible = rows.slice(0, shown);
	const single = selected === "all" ? undefined : gameEventById(selected);

	const scorePoints = trendPointsOf(rows, "score");
	const rankPoints = trendPointsOf(rows, "rank");
	const metric: TrendMetric =
		metricChoice === "score" && scorePoints.length === 0 && rankPoints.length > 0
			? "rank"
			: metricChoice === "rank" && rankPoints.length === 0 && scorePoints.length > 0
				? "score"
				: metricChoice;
	const points = metric === "score" ? scorePoints : rankPoints;
	const summary = summarizeTrend(points, metric);
	const unit = single ? (scoreUnitOf(single) ?? t("result.pointsFallback")) : "";

	const monthText = (runStart: string) =>
		t(`monthsShort.${MONTH_IDS[zoneParts(Date.parse(runStart), zone).month]}`);

	const resultLine = ({ result, event }: HistoryRow) => {
		if (!result.tookPart) return t("history.skipped");
		const rewards = (result.rewards ?? []).map((reward) => reward.name).join(", ");
		if (result.tier) {
			const stars = starChangeOf(event, result.tier, result.placement);
			return stars === undefined
				? t("history.tierOnly", { tier: result.tier, placement: result.placement ?? "" })
				: t("history.stars", {
						count: Math.abs(stars),
						amount: `${stars > 0 ? "+" : ""}${formatNumber(stars)}`,
					});
		}
		if (result.difficulty) {
			return t("history.waves", {
				difficulty: result.difficulty,
				count: result.waves ?? 0,
				amount: formatNumber(result.waves ?? 0),
			});
		}
		if (result.reached) {
			const total = targetsOf(event, result.version).length;
			return t("history.targets", {
				unit: scoreUnitOf(event) ?? t("result.pointsFallback"),
				reached: formatNumber(result.reached.length),
				total: formatNumber(total),
			});
		}
		return rewards ? t("history.tookPartRewards", { rewards }) : t("history.tookPart");
	};

	const allianceText = ({ result }: HistoryRow) => {
		if (result.allianceRank !== undefined) return formatNumber(result.allianceRank);
		if (result.tier)
			return t("history.tierOnly", { tier: result.tier, placement: result.placement ?? "" });
		return undefined;
	};

	const scoreText = (row: HistoryRow) => {
		const score = scoreOfResult(row.result, row.event);
		return score === undefined ? undefined : formatNumber(score);
	};

	const dash = t("history.none");
	const changeText = summary?.change
		? `${summary.change.amount > 0 ? "+" : ""}${formatNumber(summary.change.amount)}`
		: dash;
	const percent =
		summary?.change && metric === "score" && summary.change.previous.value !== 0
			? (summary.change.amount / summary.change.previous.value) * 100
			: undefined;

	if (results.length === 0) {
		return (
			<Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
				<h2 className="text-lg font-semibold">{t("history.emptyTitle")}</h2>
				<p className="text-muted max-w-md">{t("history.emptyText")}</p>
			</Card>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div className="lg:flex-1">
					<Field label={t("history.eventFilter")}>
						<IconSelect
							label={t("history.eventFilter")}
							value={selected}
							onChange={(id) => {
								setEventId(id);
								setShown(PAGE_SIZE);
							}}
							options={[
								{ id: "all", label: t("history.allEvents") },
								...withResults.map((event) => ({
									id: event.id,
									label: event.name,
									icon: event.img,
								})),
							]}
						/>
					</Field>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="font-medium">{t("history.period")}</span>
					<div className="max-lg:[&_label]:flex-1 max-lg:[&_label]:justify-center max-lg:[&>fieldset]:flex">
						<SegmentedControl
							label={t("history.period")}
							value={period}
							onChange={(next) => {
								setPeriod(next);
								setShown(PAGE_SIZE);
							}}
							options={[
								{ id: "3", label: t("history.months3") },
								{ id: "6", label: t("history.months6") },
								{ id: "all", label: t("history.allTime") },
							]}
						/>
					</div>
				</div>
			</div>
			<p className="text-muted text-sm">{t("history.intro")}</p>

			{single && (
				<Card className="flex flex-col gap-4 p-4">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold">
								{t("history.trendTitle", { name: single.name })}
							</h2>
							<span className="text-muted">
								{metric === "score"
									? t("history.trendScore", { unit })
									: t("history.trendRank")}
							</span>
						</div>
						{scorePoints.length > 0 && rankPoints.length > 0 && (
							<SegmentedControl
								label={t("history.metricLabel")}
								value={metric}
								onChange={setMetricChoice}
								options={[
									{ id: "score", label: t("history.metricScore") },
									{ id: "rank", label: t("history.metricRank") },
								]}
							/>
						)}
					</div>
					{summary ? (
						<>
							<TrendChart
								points={points}
								metric={metric}
								zone={zone}
								label={t("history.chartLabel", { name: single.name })}
							/>
							<dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
								<Tile
									label={t("history.best")}
									value={formatNumber(summary.best.value)}
									sub={monthText(summary.best.runStart)}
								/>
								<Tile
									label={t("history.average")}
									value={formatNumber(summary.average)}
									sub={t("history.events", {
										count: summary.count,
										amount: formatNumber(summary.count),
									})}
								/>
								<Tile
									label={t("history.latest")}
									value={formatNumber(summary.latest.value)}
									sub={monthText(summary.latest.runStart)}
								/>
								<Tile
									label={t("history.change")}
									value={changeText}
									positive={(summary.change?.amount ?? 0) > 0}
									sub={
										summary.change
											? percent === undefined
												? t("history.changeVs", {
														month: monthText(
															summary.change.previous.runStart
														),
													})
												: t("history.changePercentVs", {
														percent: `${percent > 0 ? "+" : ""}${formatDecimal(percent, 1)}`,
														month: monthText(
															summary.change.previous.runStart
														),
													})
											: t("history.noPrevious")
									}
								/>
							</dl>
						</>
					) : (
						<Note>{t("history.noTrend")}</Note>
					)}
				</Card>
			)}

			<p role="status" className="text-muted">
				{single
					? t("history.showingEvent", {
							count: rows.length,
							amount: formatNumber(rows.length),
							name: single.name,
						})
					: t("history.showing", {
							shown: formatNumber(visible.length),
							total: formatNumber(rows.length),
						})}
			</p>

			{rows.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("history.noneInPeriod")}</p>
				</Card>
			) : (
				<>
					<Card className="max-lg:hidden">
						<table className="w-full">
							<thead>
								<tr className="text-muted border-line border-b-[1.5px] text-start font-mono text-[11px] tracking-[0.08em] uppercase">
									<th className="px-4 py-3 font-normal">
										{t("history.colDate")}
									</th>
									{!single && (
										<th className="py-3 font-normal">
											{t("history.colEvent")}
										</th>
									)}
									<th className="py-3 text-end font-normal">
										{t("history.colScore")}
									</th>
									<th className="py-3 ps-4 text-end font-normal">
										{t("history.colRank")}
									</th>
									<th className="py-3 ps-4 text-end font-normal">
										{t("history.colAlliance")}
									</th>
									<th className="py-3 ps-4 font-normal">
										{t("history.colResult")}
									</th>
									<th className="py-3 pe-4 font-normal">
										<span className="sr-only">{t("history.colActions")}</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{visible.map((row) => (
									<tr
										key={row.result.id}
										className="border-line border-b-[1.5px] last:border-b-0"
									>
										<td className="text-muted px-4 py-4 font-mono text-sm whitespace-nowrap">
											{shortDayText(Date.parse(row.result.runStart), zone)}
										</td>
										{!single && (
											<td className="py-4">
												<span className="flex items-center gap-2 font-semibold">
													<span
														aria-hidden="true"
														className={`size-2.5 rounded-sm ${CATEGORY_BAR[row.event.category]}`}
													/>
													<ItemIcon src={row.event.img} size={24} />
													{row.event.name}
												</span>
											</td>
										)}
										<td className="py-4 text-end font-mono font-semibold">
											{scoreText(row) ?? dash}
										</td>
										<td className="py-4 ps-4 text-end font-mono">
											{row.result.rank === undefined
												? dash
												: formatNumber(row.result.rank)}
										</td>
										<td className="py-4 ps-4 text-end font-mono whitespace-nowrap">
											{allianceText(row) ?? dash}
										</td>
										<td className="text-muted py-4 ps-4">{resultLine(row)}</td>
										<td className="py-4 pe-4 text-end">
											<EditButton
												result={row.result}
												name={row.event.name}
												onEdit={onEdit}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</Card>
					<ul className="flex flex-col gap-3 lg:hidden">
						{visible.map((row) => {
							const score = scoreText(row);
							const unitText = scoreUnitOf(row.event);
							const rankParts = [
								row.result.rank === undefined
									? undefined
									: t("history.rankText", {
											rank: formatNumber(row.result.rank),
										}),
								row.result.allianceRank === undefined
									? undefined
									: t("history.allianceRankText", {
											rank: formatNumber(row.result.allianceRank),
										}),
								resultLine(row),
							].filter(Boolean);
							return (
								<li key={row.result.id}>
									<Card className="flex flex-col gap-1 p-4">
										<div className="flex items-start justify-between gap-3">
											<span className="flex items-center gap-2 font-semibold">
												<span
													aria-hidden="true"
													className={`size-2.5 rounded-sm ${CATEGORY_BAR[row.event.category]}`}
												/>
												<ItemIcon src={row.event.img} size={24} />
												{row.event.name}
											</span>
											<span className="text-muted font-mono text-sm">
												{shortDayText(
													Date.parse(row.result.runStart),
													zone
												)}
											</span>
										</div>
										<span className="font-mono text-lg font-semibold">
											{score
												? row.event.resultShape === "waves"
													? t("history.defensePoints", { score })
													: t("history.scoreUnit", {
															score,
															unit:
																unitText ??
																t("result.pointsFallback"),
														})
												: t("history.noScore")}
										</span>
										<span className="text-muted text-sm">
											{rankParts.join(t("history.separator"))}
										</span>
										<div>
											<EditButton
												result={row.result}
												name={row.event.name}
												onEdit={onEdit}
											/>
										</div>
									</Card>
								</li>
							);
						})}
					</ul>
					{rows.length > visible.length && (
						<Button onClick={() => setShown(shown + PAGE_SIZE)}>
							{t("history.showMore")}
						</Button>
					)}
				</>
			)}
		</>
	);
}

function Tile({
	label,
	value,
	sub,
	positive = false,
}: {
	label: string;
	value: string;
	sub: string;
	positive?: boolean;
}) {
	return (
		<Card className="bg-bg flex flex-col gap-1 px-4 py-3">
			<dt className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
				{label}
			</dt>
			<dd className={`font-mono text-xl font-semibold ${positive ? "text-kept" : ""}`}>
				{value}
			</dd>
			<dd className="text-muted text-sm">{sub}</dd>
		</Card>
	);
}

function EditButton({
	result,
	name,
	onEdit,
}: {
	result: EventResultState;
	name: string;
	onEdit: (id: string) => void;
}) {
	const t = useTranslations("events.history");

	return (
		<Button
			variant="link"
			className="px-2 underline"
			aria-label={t("editNamed", { name })}
			onClick={() => onEdit(result.id)}
		>
			{t("edit")}
		</Button>
	);
}
