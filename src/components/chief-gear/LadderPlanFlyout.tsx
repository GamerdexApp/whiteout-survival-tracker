"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatCompact, formatDateTime, formatNumber } from "@/lib/format";
import { exportSpecOf as charmExportSpecOf } from "@/service/chiefCharmExport";
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
	unlockedLimitStop,
} from "@/service/chiefGear";
import { exportSpecOf as gearExportSpecOf } from "@/service/chiefGearExport";
import type { LadderPlan } from "@/service/chiefGearExport";
import { exportedPlanOf } from "@/service/eventExport";
import { charmConverter, chiefGearSlotList, gearConverter } from "@/data/game/chiefGear";
import { findItem } from "@/data/game/items";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface LadderPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	kind: LadderKind;
	onClose: () => void;
	onSave: (goals: PlanGoalMap) => void;
}

const EXPORT_PAGE = { gear: "chiefGear", charm: "chiefCharms" } as const;
const SAVED_KEY = { gear: "chiefGearPlan", charm: "chiefCharmsPlan" } as const;

export function LadderPlanFlyout({ open, chief, kind, onClose, onSave }: LadderPlanFlyoutProps) {
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<PlanGoalMap>({});
	const [exportOpen, setExportOpen] = useState(false);
	const t = useTranslations("chiefGear.plan");
	const items = useMemo(() => itemsOf(kind, chief), [kind, chief]);
	const plan = useMemo(() => runItemPlan(items, goals), [items, goals]);
	const exportPage = EXPORT_PAGE[kind];
	const exportedAt = exportedPlanOf(chief, exportPage)?.savedAt;
	const exportedAtOnOpen = useRef(exportedAt);

	useEffect(() => {
		if (open && exportedAt !== exportedAtOnOpen.current) onClose();
		exportedAtOnOpen.current = exportedAt;
	}, [open, exportedAt, onClose]);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setGoals(initialGoalMap(itemsOf(kind, chief)));
	}

	const savedAt = chief[SAVED_KEY[kind]]?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t(`${kind}.title`)}
			description={t(`${kind}.description`)}
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							{t("saved", { date: formatDateTime(savedAt) })}
						</span>
					)}
					<Button onClick={onClose}>{t("close")}</Button>
					<Button
						disabled={plan.byItem.length === 0}
						title={plan.byItem.length === 0 ? t("export.nothingToExport") : undefined}
						onClick={() => setExportOpen(true)}
					>
						{t("export.button")}
					</Button>
					<Button variant="primary" onClick={() => onSave(goals)}>
						{t("save")}
					</Button>
				</>
			}
		>
			<PlanBody
				chief={chief}
				kind={kind}
				goals={goals}
				onGoalsChange={setGoals}
				items={items}
				plan={plan}
			/>
			<ExportToEventFlyout
				open={exportOpen}
				chief={chief}
				spec={kind === "gear" ? gearExportSpecOf(plan) : charmExportSpecOf(plan)}
				onClose={() => setExportOpen(false)}
			/>
		</Flyout>
	);
}

const goalStops = (item: LadderItem, chief: Playthrough) =>
	ladderStops(item.kind, chief).filter((stop) => {
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
	items,
	plan,
}: {
	chief: Playthrough;
	kind: LadderKind;
	goals: PlanGoalMap;
	onGoalsChange: (goals: PlanGoalMap) => void;
	items: LadderItem[];
	plan: LadderPlan;
}) {
	const t = useTranslations("chiefGear.plan");
	const stepWord = t(`${kind}.stepWord`);
	const converter = kind === "gear" ? gearConverter : charmConverter;

	return (
		<>
			<Card className="flex flex-col gap-3 p-4">
				<h3 className="font-semibold">{t("inputs")}</h3>
				<div className="flex flex-col">
					{chiefGearSlotList.map((slot) => {
						const group = items.filter((item) => item.slotId === slot.id);
						return (
							<div key={slot.id} className="flex flex-col">
								{kind === "charm" && (
									<SectionLabel className="text-muted border-line border-t-[1.5px] pt-2 pb-1">
										{t("slotTroop", { slot: slot.name, troop: slot.troopType })}
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
											{t("from", { level: levelLabel(kind, item.current) })}
										</span>
										{item.lockedCurrent && (
											<span className="text-muted basis-full text-xs">
												{t("lockedCurrent", {
													name: item.lockedCurrent.name,
													requirement: item.lockedCurrent.requirement,
												})}
											</span>
										)}
										<LevelStepper
											wide
											label={
												kind === "gear"
													? t("goalLabel", { label: item.label })
													: t("slotGoalLabel", {
															slot: slot.name,
															label: item.label,
														})
											}
											stops={goalStops(item, chief)}
											limitValue={unlockedLimitStop(chief, kind)}
											disabled={item.lockedCurrent !== null}
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
				<p className="text-muted text-xs">{t("inputsHint")}</p>
			</Card>

			<PlanStockCheck checks={ladderChecks(plan.total.materials, chief)} timeNote="" />
			<p className="text-muted text-xs">{t(`${kind}.conversionNote`)}</p>

			<Card className="flex flex-col gap-4 p-4">
				<h3 className="font-semibold">{t("result")}</h3>
				<div className="grid grid-cols-3 gap-3">
					{[
						[formatNumber(plan.total.steps), stepWord],
						[formatNumber(plan.total.score), t("score")],
						[formatCompact(plan.total.power), t("powerGain")],
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
						[t("events.svs"), plan.total.eventPoints.svs],
						[t("events.allianceShowdown"), plan.total.eventPoints.allianceShowdown],
						[t("events.kingOfIcefield"), plan.total.eventPoints.kingOfIcefield],
						[t("events.hallOfChief"), plan.total.eventPoints.hallOfChief],
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
					<h3 className="font-semibold">
						{kind === "gear" ? t("bySlot") : t("byCharm")}
					</h3>
					<ScrollRegion label={kind === "gear" ? t("bySlot") : t("byCharm")}>
						<table className="w-full min-w-[24rem] text-left">
							<thead>
								<tr>
									{[
										kind === "gear" ? t("columnSlot") : t("columnCharm"),
										stepWord,
										t("score"),
										t("powerGain"),
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
												: t("slotCharm", {
														slot:
															chiefGearSlotList.find(
																(slot) => slot.id === item.slotId
															)?.name ?? "",
														charm: item.label,
													})}
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
					</ScrollRegion>
				</Card>
			)}

			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">{t("converter.title")}</h3>
				<ScrollRegion label={t("converter.title")}>
					<table className="w-full min-w-88 text-left">
						<thead>
							<tr>
								{[
									t("converter.spend"),
									t("converter.get"),
									t("converter.limit"),
								].map((head) => (
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
										{t("converter.amount", {
											quantity: String(rate.fromQuantity),
											name:
												findItem(rate.fromItemId)?.name ?? rate.fromItemId,
										})}
									</td>
									<td className="pr-3">
										{t("converter.amount", {
											quantity: String(rate.toQuantity),
											name: findItem(rate.toItemId)?.name ?? rate.toItemId,
										})}
									</td>
									<td className="text-muted font-mono text-xs">
										{"weeklyLimit" in rate && rate.weeklyLimit
											? t("converter.perWeek", {
													limit: formatNumber(rate.weeklyLimit),
												})
											: t("converter.noLimit")}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</ScrollRegion>
			</Card>
		</>
	);
}
