"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type { Playthrough, TroopId } from "@/types/app";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { campJob, secondsFrom, shortLines } from "@/service/queues";
import type { CostLine } from "@/service/queues";
import {
	batchCapacityOf,
	draftWithBoosts,
	estimateBatch,
	noBoosts,
	trainableTiers,
} from "@/service/troopQueue";
import type { StartTrainingInput, TrainingBatch, TrainingBoosts } from "@/service/troopQueue";
import { campLabelOf, campOf, TROOP_IDS } from "@/service/troops";
import { runTroopsPlan } from "@/service/troopsPlan";
import { findItem } from "@/data/game/items";
import { findTroop } from "@/data/game/troops";
import { HoursMinutesFields } from "@/comps/queues/HoursMinutesFields";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import { CapacityAndSpeed } from "./TroopsPlanControls";

interface StartTrainingFlyoutProps {
	open: boolean;
	chief: Playthrough;
	initialCamp: TroopId;
	onClose: () => void;
	onStart: (inputs: StartTrainingInput[]) => void;
}

type StartMode = "now" | "already";
type CampChoice = TroopId | "all";

const ALL_CAMPS = "all";

const startModeIds: StartMode[] = ["now", "already"];
const actionIds = ["training", "promotion"] as const;

const commonTiers = (chief: Playthrough, camps: TroopId[]) =>
	camps.length === 0
		? []
		: trainableTiers(chief, camps[0]).filter((tier) =>
				camps.every((id) => trainableTiers(chief, id).includes(tier))
			);

const mergeCost = (lines: CostLine[]): CostLine[] => {
	const merged = new Map<string, CostLine>();
	for (const line of lines) {
		const held = merged.get(line.itemId);
		merged.set(line.itemId, { ...line, amount: (held?.amount ?? 0) + line.amount });
	}
	return [...merged.values()];
};

const digits = (value: string) => value.replace(/\D/g, "").slice(0, 9);

export function StartTrainingFlyout({
	open,
	chief,
	initialCamp,
	onClose,
	onStart,
}: StartTrainingFlyoutProps) {
	const t = useTranslations("troops.queue.flyout");
	const names = useTranslations("troops.queue.batchName");
	const now = useNow(15_000);
	const [wasOpen, setWasOpen] = useState(false);
	const [camp, setCamp] = useState<CampChoice>(initialCamp);
	const [action, setAction] = useState<TrainingBatch["mode"]>("training");
	const [tier, setTier] = useState(1);
	const [fromTier, setFromTier] = useState(1);
	const [toTier, setToTier] = useState(2);
	const [countText, setCountText] = useState("");
	const [mode, setMode] = useState<StartMode>("now");
	const [hours, setHours] = useState("");
	const [minutes, setMinutes] = useState("");
	const [takeCost, setTakeCost] = useState(true);
	const [boosts, setBoosts] = useState<TrainingBoosts>(noBoosts);

	const freeCamps = TROOP_IDS.filter(
		(id) => !campJob(chief, id) && trainableTiers(chief, id).length > 0
	);
	const allCamps = camp === ALL_CAMPS;
	const targets: TroopId[] = allCamps ? freeCamps : [camp];
	const tiers = commonTiers(chief, targets);
	const capacity = batchCapacityOf(chief, boosts);
	const boostsResult = runTroopsPlan(chief, draftWithBoosts(boosts, []));

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			const firstFree =
				TROOP_IDS.find((id) => id === initialCamp && !campJob(chief, id)) ??
				TROOP_IDS.find((id) => !campJob(chief, id)) ??
				initialCamp;
			const firstTiers = trainableTiers(chief, firstFree);
			const top = firstTiers[firstTiers.length - 1] ?? 1;
			setCamp(firstFree);
			setAction("training");
			setTier(top);
			setFromTier(Math.max(1, top - 1));
			setToTier(top);
			setCountText(String(capacity));
			setMode("now");
			setTakeCost(true);
			setBoosts(noBoosts);
		}
	}

	const chooseCamp = (next: CampChoice) => {
		const nextTiers = commonTiers(chief, next === ALL_CAMPS ? freeCamps : [next]);
		const top = nextTiers[nextTiers.length - 1] ?? 1;
		setCamp(next);
		setTier(top);
		setFromTier(Math.max(1, top - 1));
		setToTier(top);
		if (next === ALL_CAMPS) setMode("now");
	};

	const chooseFromTier = (next: number) => {
		setFromTier(next);
		if (toTier <= next) setToTier(next + 1);
	};

	const count = Math.min(capacity, Number(countText || 0));
	const promotionTiers = tiers.slice(0, -1);
	const toChoices = tiers.filter((value) => value > fromTier);
	const canBuild = tiers.length > 0 && (action === "training" || toChoices.length > 0);
	const busy = allCamps ? undefined : campJob(chief, camp);
	const batches: TrainingBatch[] = targets.map((id) => ({
		camp: id,
		mode: action,
		tier,
		fromTier,
		toTier,
		count,
	}));
	const ready = canBuild && count > 0 && !busy && targets.length > 0;
	const estimates = ready ? batches.map((batch) => estimateBatch(chief, batch, boosts)) : [];
	const estimate = estimates[0];
	const cost: CostLine[] = mergeCost(estimates.flatMap((item) => item.cost));
	const yourSeconds = estimate?.seconds ?? 0;
	const typedSeconds = secondsFrom(Number(hours || 0), Number(minutes || 0));
	const secondsFor = (index: number) =>
		mode === "now" ? (estimates[index]?.seconds ?? 0) : typedSeconds;
	const endsAt = new Date(now + secondsFor(0) * 1_000);
	const short = shortLines(chief, cost);

	const chooseMode = (next: StartMode) => {
		setMode(next);
		if (next === "already") {
			setHours(String(Math.floor(yourSeconds / 3_600)));
			setMinutes(String(Math.floor((yourSeconds % 3_600) / 60)));
		}
	};

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button
						variant="primary"
						disabled={!ready}
						onClick={() => {
							const startedAt = new Date();
							onStart(
								batches.map((batch, index) => ({
									batch,
									cost: estimates[index].cost,
									startedAt,
									endsAt: new Date(
										startedAt.getTime() + secondsFor(index) * 1_000
									),
									takeCost,
								}))
							);
						}}
					>
						{t("start")}
					</Button>
				</>
			}
		>
			<Card className="flex flex-col gap-3 p-4">
				<Field label={t("camp")} hint={t("campHelp")}>
					<Select
						data-autofocus
						value={camp}
						onChange={(event) => chooseCamp(event.target.value as CampChoice)}
					>
						{freeCamps.length > 1 && (
							<option value={ALL_CAMPS}>
								{t("allCamps", { count: formatNumber(freeCamps.length) })}
							</option>
						)}
						{TROOP_IDS.map((id) => {
							const job = campJob(chief, id);
							const label = campLabelOf(chief, id);
							return (
								<option key={id} value={id}>
									{campOf(id).name}
									{job
										? ` (${t("busy", { date: formatDateTime(job.endsAt) })})`
										: label
											? ""
											: ` (${t("notBuilt")})`}
								</option>
							);
						})}
					</Select>
				</Field>
				{busy && (
					<p className="text-muted">{t("busy", { date: formatDateTime(busy.endsAt) })}</p>
				)}
				{allCamps && <p className="text-muted">{t("allCampsHint")}</p>}
				<SegmentedControl
					label={t("action")}
					options={actionIds.map((id) => ({ id, label: t(id) }))}
					value={action}
					onChange={setAction}
				/>
				{!canBuild ? (
					<p className="text-muted">{t("noTiers")}</p>
				) : action === "training" ? (
					<Field label={t("tier")}>
						<Select
							value={tier}
							onChange={(event) => setTier(Number(event.target.value))}
						>
							{tiers.map((value) => (
								<option key={value} value={value}>
									{t("tierOption", { tier: value })}
								</option>
							))}
						</Select>
					</Field>
				) : (
					<div className="grid grid-cols-2 gap-3">
						<Field label={t("fromTier")}>
							<Select
								value={fromTier}
								onChange={(event) => chooseFromTier(Number(event.target.value))}
							>
								{promotionTiers.map((value) => (
									<option key={value} value={value}>
										{t("tierOption", { tier: value })}
									</option>
								))}
							</Select>
						</Field>
						<Field label={t("toTier")}>
							<Select
								value={toTier}
								onChange={(event) => setToTier(Number(event.target.value))}
							>
								{toChoices.map((value) => (
									<option key={value} value={value}>
										{t("tierOption", { tier: value })}
									</option>
								))}
							</Select>
						</Field>
					</div>
				)}
				<Field
					label={t("troops")}
					hint={t("capacityHint", { capacity: formatNumber(capacity) })}
				>
					<div className="flex gap-2">
						<Input
							inputMode="numeric"
							className="text-end font-mono"
							value={countText === "" ? "" : formatNumber(Number(countText))}
							onChange={(event) => setCountText(digits(event.target.value))}
						/>
						<Button onClick={() => setCountText(String(capacity))}>{t("max")}</Button>
					</div>
				</Field>
			</Card>

			<CapacityAndSpeed
				draft={draftWithBoosts(boosts, [])}
				result={boostsResult}
				onDraftChange={(next) =>
					setBoosts({
						position: next.position,
						rank: next.rank,
						capacityBoost: next.capacityBoost,
						mobilize: next.mobilize,
						advancedTraining: next.advancedTraining,
					})
				}
			/>

			{ready && estimate && (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<div className="flex flex-col gap-0.5">
							{batches.map((batch) => {
								const name = findTroop(batch.camp)?.name ?? batch.camp;
								return (
									<h3 key={batch.camp} className="font-semibold">
										{action === "training"
											? names("training", {
													count: formatNumber(count),
													name,
													tier,
												})
											: names("promotion", {
													count: formatNumber(count),
													name,
													from: fromTier,
													to: toTier,
												})}
									</h3>
								);
							})}
						</div>
						<h3 className="font-semibold">{t("cost")}</h3>
						<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{cost.map((line) => (
								<li key={line.itemId} className="flex items-start gap-2">
									<ItemIcon src={findItem(line.itemId)?.img} size={20} />
									<span className="flex flex-col">
										<span className="text-muted text-xs">{line.name}</span>
										<span className="font-mono font-semibold">
											{formatNumber(line.amount)}
										</span>
									</span>
								</li>
							))}
						</ul>
					</Card>

					<Card className="flex flex-col gap-2 p-4">
						<h3 className="font-semibold">{t("time")}</h3>
						<div className="flex justify-between gap-3">
							<span>{t("packageTime")}</span>
							<span className="font-mono">
								{formatDuration(estimate.packageSeconds)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span>{t("speed")}</span>
							<span className="flex items-center gap-2">
								<span className="font-mono">{`${formatNumber(estimate.speedPercent)}%`}</span>
								<Badge tone="added">{t("readOnly")}</Badge>
								<Link href="/bonuses" className="text-link text-xs underline">
									{t("openBonuses")}
								</Link>
							</span>
						</div>
						<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
							<span className="font-semibold">{t("yourTime")}</span>
							{batches.length === 1 ? (
								<span className="text-primary font-mono font-semibold">
									{formatDuration(yourSeconds)}
								</span>
							) : (
								<span className="flex flex-col items-end">
									{batches.map((batch, index) => (
										<span
											key={batch.camp}
											className="text-primary font-mono font-semibold"
										>
											{t("campTime", {
												camp: findTroop(batch.camp)?.name ?? batch.camp,
												time: formatDuration(estimates[index].seconds),
											})}
										</span>
									))}
								</span>
							)}
						</div>
						<p className="text-muted text-xs">{t("timeHint")}</p>
					</Card>

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("whenStarted")}</h3>
						{!allCamps && (
							<SegmentedControl
								label={t("whenStarted")}
								options={startModeIds.map((id) => ({
									id,
									label: t(`modes.${id}`),
								}))}
								value={mode}
								onChange={chooseMode}
							/>
						)}
						{mode === "already" && (
							<HoursMinutesFields
								hoursLabel={t("timeLeftHours")}
								hours={hours}
								minutes={minutes}
								onChange={(nextHours, nextMinutes) => {
									setHours(nextHours);
									setMinutes(nextMinutes);
								}}
							/>
						)}
						<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
							<span>{t("ends")}</span>
							<span className="font-mono">
								{formatDateTime(endsAt.toISOString())}
							</span>
						</div>
					</Card>

					<Card className="flex flex-col gap-2 p-4">
						<div className="flex items-start justify-between gap-3">
							<div className="flex flex-col">
								<span className="font-semibold">{t("takeCost.title")}</span>
								<span className="text-muted text-xs">{t("takeCost.hint")}</span>
							</div>
							<Switch
								label={t("takeCost.title")}
								checked={takeCost}
								onChange={setTakeCost}
							/>
						</div>
						{takeCost && (
							<p className={short.length === 0 ? "text-kept" : "text-danger"}>
								{short.length === 0
									? t("takeCost.enough")
									: t("takeCost.short", {
											names: short.map((line) => line.name).join(", "),
										})}
							</p>
						)}
					</Card>
				</>
			)}
		</Flyout>
	);
}
