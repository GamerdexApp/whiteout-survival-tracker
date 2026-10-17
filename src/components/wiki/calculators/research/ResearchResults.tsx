"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatDecimal, formatDuration, formatNumber } from "@/lib/format";
import {
	placeholderLinesOf,
	plannedNodeOf,
	speedupEventRowsOf,
	statGainsOf,
} from "@/service/calcResearch";
import type { ResearchCalculatorInputs, SpeedupEventRow, StatGain } from "@/service/calcResearch";
import type { ResearchCalculation, ResearchItemResult } from "@/data/game/calcResearch";
import { findBuildingById, isPlaceholder } from "@/data/game/calcResearch";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../../tables/ResourceList";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";
import { UnknownValue } from "../../UnknownValue";

const UNMET_SHOWN = 15;

interface ResearchResultsProps {
	inputs: ResearchCalculatorInputs;
	calculation: ResearchCalculation;
}

export function ResearchResults({ inputs, calculation }: ResearchResultsProps) {
	const t = useTranslations("calcResearch.results");

	if (calculation.steps === 0) {
		return (
			<Card className="p-4">
				<p className="text-muted">{t("empty")}</p>
			</Card>
		);
	}

	return (
		<section className="flex flex-col gap-4" aria-label={t("title")}>
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				<StatTile value={formatNumber(calculation.steps)} label={t("stats.steps")} />
				<StatTile
					value={formatDuration(calculation.baseSeconds)}
					label={t("stats.baseTime")}
				/>
				<StatTile
					value={formatDuration(calculation.seconds)}
					label={t("stats.time", {
						percent: formatDecimal(calculation.researchSpeedPercent),
					})}
					emphasis
				/>
				<StatTile
					value={t("plus", { value: formatNumber(calculation.power) })}
					label={t("stats.power")}
				/>
				<StatTile
					value={formatNumber(calculation.speedupMinutesNeeded)}
					label={t("stats.speedupMinutes")}
				/>
			</div>
			<RequirementNotes calculation={calculation} />
			<div className="grid gap-4 lg:grid-cols-2 lg:items-start">
				<ResourcesCard calculation={calculation} />
				<StatGainsCard calculation={calculation} inputs={inputs} />
			</div>
			<EventPointsCard calculation={calculation} />
			<LineBreakdown items={calculation.items.filter((item) => item.steps > 0)} />
		</section>
	);
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{title}</h3>
			{children}
		</Card>
	);
}

function ResourcesCard({ calculation }: { calculation: ResearchCalculation }) {
	const t = useTranslations("calcResearch.results.resources");

	return (
		<ResultCard title={t("title")}>
			{calculation.resources.length === 0 ? (
				<UnknownValue />
			) : (
				<ul className="flex flex-col">
					{calculation.resources.map((resource) => {
						const item = findItem(resource.itemId);
						return (
							<li
								key={resource.itemId}
								className="border-line flex min-h-11 items-center gap-3 border-t-[1.5px] py-1 first:border-t-0"
							>
								<ItemIcon src={item?.img} size={28} />
								<span className="flex-1">{item?.name ?? resource.itemId}</span>
								<span className="font-mono">{formatNumber(resource.amount)}</span>
							</li>
						);
					})}
				</ul>
			)}
		</ResultCard>
	);
}

function StatGainsCard({
	calculation,
	inputs,
}: {
	calculation: ResearchCalculation;
	inputs: ResearchCalculatorInputs;
}) {
	const t = useTranslations("calcResearch.results.bonuses");
	const { gains, unlocks } = statGainsOf(calculation, inputs);
	const gainText = (gain: StatGain) =>
		gain.unit === "percent"
			? t("percentGain", { value: formatDecimal(gain.amount) })
			: t("flatGain", { value: formatNumber(gain.amount) });

	return (
		<ResultCard title={t("title")}>
			{gains.length === 0 && unlocks.length === 0 ? (
				<p className="text-muted">{t("none")}</p>
			) : (
				<ul className="flex flex-col">
					{gains.map((gain) => (
						<li
							key={`${gain.stat}-${gain.unit}`}
							className="border-line flex min-h-9 items-center justify-between gap-3 border-t-[1.5px] py-1 first:border-t-0"
						>
							<span>{gain.stat}</span>
							<span className="font-mono">{gainText(gain)}</span>
						</li>
					))}
					{unlocks.map((unlock) => (
						<li
							key={unlock}
							className="border-line flex min-h-9 items-center border-t-[1.5px] py-1 first:border-t-0"
						>
							{unlock}
						</li>
					))}
				</ul>
			)}
		</ResultCard>
	);
}

function EventPointsCard({ calculation }: { calculation: ResearchCalculation }) {
	const t = useTranslations("calcResearch.results.events");
	const hallRows = calculation.eventPoints.hallOfChief;

	const speedupColumns: StackColumn<SpeedupEventRow>[] = [
		{
			id: "event",
			header: t("columns.event"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-medium">{t(`names.${row.id}`)}</span>,
		},
		{
			id: "shards",
			header: t("columns.shardPoints"),
			width: "10rem",
			render: (row) => <span className="font-mono">{formatNumber(row.shardPoints)}</span>,
		},
		{
			id: "speedups",
			header: t("columns.speedupPoints"),
			width: "10rem",
			render: (row) => <span className="font-mono">{formatNumber(row.speedupPoints)}</span>,
		},
		{
			id: "total",
			header: t("columns.total"),
			width: "10rem",
			render: (row) => (
				<span className="font-mono font-semibold">
					{formatNumber(row.shardPoints + row.speedupPoints)}
				</span>
			),
		},
	];

	const hallColumns: StackColumn<(typeof hallRows)[number]>[] = [
		{
			id: "rate",
			header: t("columns.pointsPerPower"),
			width: "12rem",
			render: (row) => (
				<span className="font-medium">
					{t("pointsPerPower", { value: formatNumber(row.pointsPerPower) })}
				</span>
			),
		},
		{
			id: "days",
			header: t("columns.days"),
			width: "minmax(0, 1fr)",
			render: (row) => <span>{row.days.join(t("daySeparator"))}</span>,
		},
		{
			id: "points",
			header: t("columns.points"),
			width: "10rem",
			render: (row) => (
				<span className="font-mono font-semibold">{formatNumber(row.points)}</span>
			),
		},
	];

	return (
		<ResultCard title={t("title")}>
			<StackTable
				label={t("speedupTableLabel")}
				columns={speedupColumns}
				rows={speedupEventRowsOf(calculation)}
				rowKey={(row) => row.id}
			/>
			<p className="text-muted text-xs">
				{t("speedupNote", {
					minutes: formatNumber(calculation.speedupMinutesNeeded),
				})}
			</p>
			<h4 className="font-medium">{t("names.hallOfChief")}</h4>
			<StackTable
				label={t("hallTableLabel")}
				columns={hallColumns}
				rows={hallRows}
				rowKey={(row) => String(row.pointsPerPower)}
			/>
			<p className="text-muted text-xs">{t("hallNote")}</p>
		</ResultCard>
	);
}

function RequirementNotes({ calculation }: { calculation: ResearchCalculation }) {
	const t = useTranslations("calcResearch.results.requirements");
	const placeholders = placeholderLinesOf(calculation);
	const unmet = calculation.unmetPrerequisites;
	const hidden = unmet.length - UNMET_SHOWN;

	return (
		<>
			{calculation.buildingRequirements.length > 0 && (
				<Note title={t("buildings")}>
					{calculation.buildingRequirements
						.map((requirement) =>
							t("buildingLevel", {
								building: findBuildingById(requirement.id)?.name ?? requirement.id,
								level: requirement.level,
							})
						)
						.join(t("listSeparator"))}
				</Note>
			)}
			{unmet.length > 0 && (
				<Note
					tone="warning"
					title={t("unmetTitle", {
						count: unmet.length,
						amount: formatNumber(unmet.length),
					})}
				>
					{unmet
						.slice(0, UNMET_SHOWN)
						.map((item) =>
							t("unmetItem", {
								name: plannedNodeOf(item.id).name,
								level: formatNumber(item.level),
								requires: plannedNodeOf(item.requires.id).name,
								requiresLevel: formatNumber(item.requires.level),
								planned: formatNumber(item.planned),
							})
						)
						.join(t("listSeparator"))}
					{hidden > 0 && ` ${t("unmetMore", { amount: formatNumber(hidden) })}`}
				</Note>
			)}
			{calculation.stepsWithoutTime > 0 && (
				<Note>
					{t("stepsWithoutTime", {
						count: calculation.stepsWithoutTime,
						amount: formatNumber(calculation.stepsWithoutTime),
					})}
				</Note>
			)}
			{placeholders.length > 0 && (
				<Note>{t("placeholders", { names: placeholders.join(t("listSeparator")) })}</Note>
			)}
		</>
	);
}

function LineBreakdown({ items }: { items: ResearchItemResult[] }) {
	const t = useTranslations("calcResearch.results.breakdown");

	const columns: StackColumn<ResearchItemResult>[] = [
		{
			id: "line",
			header: t("columns.line"),
			width: "minmax(0, 1.2fr)",
			render: (item) => (
				<span className="flex min-w-0 flex-col">
					<span className="font-medium">{item.name}</span>
					<span className="text-muted text-xs">{item.category}</span>
				</span>
			),
		},
		{
			id: "steps",
			header: t("columns.steps"),
			width: "5rem",
			render: (item) => <span className="font-mono">{formatNumber(item.steps)}</span>,
		},
		{
			id: "time",
			header: t("columns.baseTime"),
			width: "8rem",
			render: (item) =>
				isPlaceholder(plannedNodeOf(item.id)) ? (
					<UnknownValue />
				) : (
					<span className="font-mono">{formatDuration(item.baseSeconds)}</span>
				),
		},
		{
			id: "power",
			header: t("columns.power"),
			width: "8rem",
			render: (item) => (
				<span className="font-mono">{t("plus", { value: formatNumber(item.power) })}</span>
			),
		},
		{
			id: "resources",
			header: t("columns.resources"),
			width: "minmax(0, 2fr)",
			render: (item) =>
				item.resources.length === 0 ? (
					<UnknownValue />
				) : (
					<ResourceList entries={item.resources} emptyText="" />
				),
		},
	];

	return (
		<ResultCard title={t("title")}>
			<StackTable
				label={t("title")}
				columns={columns}
				rows={items}
				rowKey={(item) => item.id}
			/>
		</ResultCard>
	);
}
