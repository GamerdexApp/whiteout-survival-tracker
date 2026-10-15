"use client";

import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatCompact, formatDateTime, formatNumber } from "@/lib/format";
import type { LadderItem, LadderKind, PlanGoalMap } from "@/service/chiefGear";
import {
	initialGoalMap,
	itemsOf,
	ladderChecks,
	ladderStops,
	levelLabel,
	NONE_STOP,
	positionOf,
	runItemPlan,
} from "@/service/chiefGear";
import { charmConverter, chiefGearSlotList, gearConverter } from "@/data/game/chiefGear";
import { findItem } from "@/data/game/items";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface LadderPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	kind: LadderKind;
	onClose: () => void;
	onSave: (goals: PlanGoalMap) => void;
}

const TEXT = {
	gear: {
		title: "Plan Chief Gear",
		description: "Materials, score and power from current level to goal",
		savedKey: "chiefGearPlan" as const,
		stepWord: "Steps",
		unit: "piece",
		conversionNote:
			"The check does not count conversions. The converter has seven exchange rates, each with a weekly limit, for example 10 Design Plans into 1 Lunar Amber up to 500 a week.",
	},
	charm: {
		title: "Plan Chief Charms",
		description: "Materials, score and power from current level to goal",
		savedKey: "chiefCharmsPlan" as const,
		stepWord: "Stages",
		unit: "charm",
		conversionNote:
			"The check does not count conversions: 2 Charm Guides make 1 Charm Design and back, and 40 of either make 1 Charm Secrets.",
	},
};

export function LadderPlanFlyout({ open, chief, kind, onClose, onSave }: LadderPlanFlyoutProps) {
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<PlanGoalMap>({});
	const text = TEXT[kind];

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setGoals(initialGoalMap(itemsOf(kind, chief)));
	}

	const savedAt = chief[text.savedKey]?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={text.title}
			description={text.description}
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							Plan saved {formatDateTime(savedAt)}
						</span>
					)}
					<Button onClick={onClose}>Close</Button>
					<Button variant="primary" onClick={() => onSave(goals)}>
						Save plan
					</Button>
				</>
			}
		>
			<PlanBody chief={chief} kind={kind} goals={goals} onGoalsChange={setGoals} />
		</Flyout>
	);
}

const goalStops = (item: LadderItem) =>
	ladderStops(item.kind).filter((stop) => {
		const position = stop.value === NONE_STOP ? -1 : positionOf(item.kind, stop.value);
		return (
			position >= positionOf(item.kind, item.current) &&
			(position >= 0 || item.current === null)
		);
	});

function PlanBody({
	chief,
	kind,
	goals,
	onGoalsChange,
}: {
	chief: Playthrough;
	kind: LadderKind;
	goals: PlanGoalMap;
	onGoalsChange: (goals: PlanGoalMap) => void;
}) {
	const items = useMemo(() => itemsOf(kind, chief), [kind, chief]);
	const plan = useMemo(() => runItemPlan(items, goals), [items, goals]);
	const text = TEXT[kind];
	const converter = kind === "gear" ? gearConverter : charmConverter;

	return (
		<>
			<Card className="flex flex-col gap-3 p-4">
				<h3 className="font-semibold">Inputs</h3>
				<div className="flex flex-col">
					{chiefGearSlotList.map((slot) => {
						const group = items.filter((item) => item.slotId === slot.id);
						return (
							<div key={slot.id} className="flex flex-col">
								{kind === "charm" && (
									<SectionLabel className="text-muted border-line border-t-[1.5px] pt-2 pb-1">
										{slot.name}, {slot.troopType}
									</SectionLabel>
								)}
								{group.map((item) => (
									<div
										key={item.key}
										className="border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
									>
										<span className="min-w-20 font-medium">
											{kind === "gear" ? slot.name : item.label}
										</span>
										<span className="text-muted font-mono text-xs">
											From {levelLabel(kind, item.current)}
										</span>
										<LevelStepper
											wide
											label={
												kind === "gear"
													? `${item.label} goal`
													: `${slot.name} ${item.label} goal`
											}
											stops={goalStops(item)}
											value={goals[item.key] ?? NONE_STOP}
											onChange={(value) =>
												onGoalsChange({
													...goals,
													[item.key]: value === NONE_STOP ? null : value,
												})
											}
										/>
									</div>
								))}
							</div>
						);
					})}
				</div>
				<p className="text-muted text-xs">
					The current level is the one on the page. Change it there. Goals are read only
					on the page and are set here.
				</p>
			</Card>

			<PlanStockCheck checks={ladderChecks(plan.total.materials, chief)} timeNote="" />
			<p className="text-muted text-xs">{text.conversionNote}</p>

			<Card className="flex flex-col gap-4 p-4">
				<h3 className="font-semibold">Result</h3>
				<div className="grid grid-cols-3 gap-3">
					{[
						[formatNumber(plan.total.steps), text.stepWord],
						[formatNumber(plan.total.score), "Score"],
						[formatCompact(plan.total.power), "Power gain"],
					].map(([value, label]) => (
						<div
							key={label}
							className="border-line flex flex-col rounded-md border-[1.5px] p-2"
						>
							<span className="font-mono text-lg">{value}</span>
							<span className="text-muted text-xs">{label}</span>
						</div>
					))}
				</div>
				<ul className="flex flex-col">
					{plan.total.materials.map(({ itemId, amount }) => {
						const item = findItem(itemId);
						return (
							<li
								key={itemId}
								className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-1.5 first:border-t-0"
							>
								<span className="flex items-center gap-2">
									<ItemIcon src={item?.img} size={24} />
									{item?.name ?? itemId}
								</span>
								<span className="font-mono">{formatNumber(amount)}</span>
							</li>
						);
					})}
				</ul>
				<div className="grid grid-cols-2 gap-3">
					{[
						["SvS State of Power", plan.total.eventPoints.svs],
						["Alliance Showdown", plan.total.eventPoints.allianceShowdown],
						["King of Icefield", plan.total.eventPoints.kingOfIcefield],
						["Hall of Chief", plan.total.eventPoints.hallOfChief],
					].map(([name, value]) => (
						<div
							key={name}
							className="border-line flex flex-col rounded-md border-[1.5px] p-2"
						>
							<span className="text-muted text-xs">{name}</span>
							<span className="font-mono font-semibold">
								{formatNumber(Number(value))}
							</span>
						</div>
					))}
				</div>
			</Card>

			{plan.byItem.length > 0 && (
				<Card className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">{kind === "gear" ? "By slot" : "By charm"}</h3>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[24rem] text-left">
							<thead>
								<tr>
									{[
										kind === "gear" ? "Slot" : "Charm",
										text.stepWord,
										"Score",
										"Power gain",
									].map((head) => (
										<th key={head} className="py-1 pr-3">
											<SectionLabel className="text-muted">
												{head}
											</SectionLabel>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{plan.byItem.map(({ item, result }) => (
									<tr key={item.key} className="border-line border-t-[1.5px]">
										<td className="py-1.5 pr-3 font-medium">
											{kind === "gear"
												? item.label
												: `${chiefGearSlotList.find((slot) => slot.id === item.slotId)?.name} ${item.label}`}
										</td>
										<td className="pr-3 font-mono">{result.steps}</td>
										<td className="pr-3 font-mono">
											{formatNumber(result.score)}
										</td>
										<td className="font-mono">{formatCompact(result.power)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}

			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">Material converter</h3>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[22rem] text-left">
						<thead>
							<tr>
								{["Spend", "Get", "Limit"].map((head) => (
									<th key={head} className="py-1 pr-3">
										<SectionLabel className="text-muted">{head}</SectionLabel>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{converter.map((rate) => (
								<tr key={rate.id} className="border-line border-t-[1.5px]">
									<td className="py-1.5 pr-3">
										{rate.fromQuantity}{" "}
										{findItem(rate.fromItemId)?.name ?? rate.fromItemId}
									</td>
									<td className="pr-3">
										{rate.toQuantity}{" "}
										{findItem(rate.toItemId)?.name ?? rate.toItemId}
									</td>
									<td className="text-muted font-mono text-xs">
										{"weeklyLimit" in rate && rate.weeklyLimit
											? `${formatNumber(rate.weeklyLimit)} per week`
											: "No weekly limit"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</>
	);
}
