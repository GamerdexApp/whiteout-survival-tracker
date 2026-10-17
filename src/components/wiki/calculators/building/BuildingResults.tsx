"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { formatDecimal, formatDuration, formatNumber } from "@/lib/format";
import {
	breakdownRowsOf,
	inResourceOrder,
	scoreEventRowsOf,
	unmetPrerequisitesOf,
	usedSpeedupMinutes,
} from "@/service/calcBuilding";
import type {
	BuildingBreakdownRow,
	BuildingCalculatorInputs,
	ScoreEventRow,
} from "@/service/calcBuilding";
import type {
	BuildingCalculation,
	BuildingHallOfChiefPoints,
	BuildingStep,
} from "@/data/game/calcBuilding";
import { buildingEventNameOf, findBuildingById } from "@/data/game/calcBuilding";
import { findItem } from "@/data/game/items";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../../tables/ResourceList";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";

interface BuildingResultsProps {
	inputs: BuildingCalculatorInputs;
	calculation: BuildingCalculation;
}

export function BuildingResults({ inputs, calculation }: BuildingResultsProps) {
	const t = useTranslations("calcBuilding.results");

	if (calculation.steps.length === 0) {
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
				<StatTile value={formatNumber(calculation.steps.length)} label={t("stats.steps")} />
				<StatTile
					value={formatDuration(calculation.baseSeconds)}
					label={t("stats.baseTime")}
				/>
				<StatTile
					value={formatDuration(calculation.seconds)}
					label={t("stats.time", {
						percent: formatDecimal(calculation.constructionSpeedPercent),
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
			<UnmetNote calculation={calculation} />
			<div className="grid gap-4 2xl:grid-cols-2 2xl:items-start">
				<ResourcesCard calculation={calculation} />
				<EventPointsCard inputs={inputs} calculation={calculation} />
			</div>
			<BuildingBreakdown rows={breakdownRowsOf(calculation)} />
			<StepDetails steps={calculation.steps} />
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

function UnmetNote({ calculation }: { calculation: BuildingCalculation }) {
	const t = useTranslations("calcBuilding.results.unmet");
	const unmet = unmetPrerequisitesOf(calculation);
	if (unmet.length === 0) return null;

	return (
		<Note title={t("title")}>
			{unmet
				.map((item) => t("item", { building: item.building, level: item.level }))
				.join(t("listSeparator"))}
		</Note>
	);
}

function ResourcesCard({ calculation }: { calculation: BuildingCalculation }) {
	const t = useTranslations("calcBuilding.results.resources");

	return (
		<ResultCard title={t("title")}>
			<ul className="flex flex-col">
				{inResourceOrder(calculation.resources).map((resource) => {
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
		</ResultCard>
	);
}

function EventPointsCard({ inputs, calculation }: BuildingResultsProps) {
	const t = useTranslations("calcBuilding.results.events");
	const hallOfChiefName = buildingEventNameOf("hallOfChief");

	const scoreColumns: StackColumn<ScoreEventRow>[] = [
		{
			id: "event",
			header: t("columns.event"),
			width: "minmax(0, 1fr)",
			render: (row) => <span className="font-medium">{row.name}</span>,
		},
		{
			id: "crystals",
			header: t("columns.crystalPoints"),
			width: "8rem",
			render: (row) => <span className="font-mono">{formatNumber(row.crystalPoints)}</span>,
		},
		{
			id: "speedups",
			header: t("columns.speedupPoints"),
			width: "7rem",
			render: (row) => <span className="font-mono">{formatNumber(row.speedupPoints)}</span>,
		},
		{
			id: "total",
			header: t("columns.total"),
			width: "8rem",
			render: (row) => (
				<span className="font-mono font-semibold">{formatNumber(row.total)}</span>
			),
		},
	];

	const hallColumns: StackColumn<BuildingHallOfChiefPoints>[] = [
		{
			id: "rate",
			header: t("columns.pointsPerPower"),
			width: "9rem",
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
			width: "8rem",
			render: (row) => (
				<span className="font-mono font-semibold">{formatNumber(row.points)}</span>
			),
		},
	];

	return (
		<ResultCard title={t("title")}>
			<StackTable
				label={t("scoreTableLabel")}
				columns={scoreColumns}
				rows={scoreEventRowsOf(inputs, calculation)}
				rowKey={(row) => row.key}
			/>
			<p className="text-muted text-xs">
				{t("speedupNote", {
					used: formatNumber(usedSpeedupMinutes(inputs, calculation)),
					needed: formatNumber(calculation.speedupMinutesNeeded),
				})}
			</p>
			<h4 className="font-medium">{hallOfChiefName}</h4>
			<StackTable
				label={t("hallTableLabel", { name: hallOfChiefName })}
				columns={hallColumns}
				rows={calculation.eventPoints.hallOfChief}
				rowKey={(row) => String(row.pointsPerPower)}
			/>
			<p className="text-muted text-xs">{t("hallNote", { name: hallOfChiefName })}</p>
		</ResultCard>
	);
}

function BuildingName({ buildingId, name }: { buildingId: string; name: string }) {
	return (
		<span className="flex items-center gap-2">
			<ItemIcon src={findBuildingById(buildingId)?.img} size={28} />
			<span className="font-medium">{name}</span>
		</span>
	);
}

function BuildingBreakdown({ rows }: { rows: BuildingBreakdownRow[] }) {
	const t = useTranslations("calcBuilding.results.breakdown");

	const columns: StackColumn<BuildingBreakdownRow>[] = [
		{
			id: "building",
			header: t("columns.building"),
			width: "minmax(0, 1.2fr)",
			render: (row) => <BuildingName buildingId={row.buildingId} name={row.name} />,
		},
		{
			id: "levels",
			header: t("columns.levels"),
			width: "minmax(0, 1fr)",
			render: (row) => (
				<span className="flex flex-wrap items-center gap-2">
					<span>{t("levelRange", { from: row.fromLevel, to: row.toLevel })}</span>
					{row.prerequisiteOnly && <Badge tone="changed">{t("prerequisite")}</Badge>}
				</span>
			),
		},
		{
			id: "steps",
			header: t("columns.steps"),
			width: "4.5rem",
			render: (row) => <span className="font-mono">{formatNumber(row.steps)}</span>,
		},
		{
			id: "power",
			header: t("columns.power"),
			width: "7rem",
			render: (row) => (
				<span className="font-mono">{t("plus", { value: formatNumber(row.power) })}</span>
			),
		},
		{
			id: "time",
			header: t("columns.baseTime"),
			width: "8rem",
			render: (row) => <span className="font-mono">{formatDuration(row.baseSeconds)}</span>,
		},
		{
			id: "resources",
			header: t("columns.resources"),
			width: "minmax(0, 2fr)",
			render: (row) => <ResourceList entries={row.resources} emptyText={t("free")} />,
		},
	];

	return (
		<ResultCard title={t("title")}>
			<StackTable
				label={t("title")}
				columns={columns}
				rows={rows}
				rowKey={(row) => row.buildingId}
			/>
		</ResultCard>
	);
}

interface NumberedStep extends BuildingStep {
	position: number;
}

function StepDetails({ steps }: { steps: BuildingStep[] }) {
	const t = useTranslations("calcBuilding.results.stepDetails");
	const [open, setOpen] = useState(false);
	const numberedSteps: NumberedStep[] = steps.map((step, index) => ({
		...step,
		position: index + 1,
	}));

	const columns: StackColumn<NumberedStep>[] = [
		{
			id: "building",
			header: t("columns.building"),
			width: "minmax(0, 1.2fr)",
			render: (step) => (
				<span className="flex flex-wrap items-center gap-2">
					<span className="text-muted font-mono text-xs">
						{formatNumber(step.position)}
					</span>
					<span className="font-medium">{step.name}</span>
					{step.prerequisite && <Badge tone="changed">{t("prerequisite")}</Badge>}
				</span>
			),
		},
		{
			id: "level",
			header: t("columns.level"),
			width: "6rem",
			render: (step) => <span>{step.level}</span>,
		},
		{
			id: "power",
			header: t("columns.power"),
			width: "7rem",
			render: (step) => (
				<span className="font-mono">{t("plus", { value: formatNumber(step.power) })}</span>
			),
		},
		{
			id: "time",
			header: t("columns.baseTime"),
			width: "8rem",
			render: (step) => <span className="font-mono">{formatDuration(step.baseSeconds)}</span>,
		},
		{
			id: "cost",
			header: t("columns.cost"),
			width: "minmax(0, 2fr)",
			render: (step) => (
				<ResourceList entries={inResourceOrder(step.cost)} exact emptyText={t("free")} />
			),
		},
	];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
				<summary className="font-semibold">
					{t("title", { count: steps.length, amount: formatNumber(steps.length) })}
				</summary>
				{open && (
					<div className="mt-3">
						<StackTable
							label={t("tableLabel")}
							columns={columns}
							rows={numberedSteps}
							rowKey={(step) => String(step.position)}
						/>
					</div>
				)}
			</details>
		</Card>
	);
}
