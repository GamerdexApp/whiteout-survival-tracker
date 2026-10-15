"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import type { SlotInfo, StartPayload, UpgradeOption } from "@/service/queues";
import { secondsFrom, shortLines } from "@/service/queues";
import { findItem } from "@/data/game/items";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import { HoursMinutesFields } from "./HoursMinutesFields";

interface StartUpgradeFlyoutProps {
	open: boolean;
	chief: Playthrough;
	title?: string;
	description: string;
	selectLabel: string;
	selectHelp: string;
	timeLabel: string;
	speedLabel: string;
	speedPercent: number;
	slotLabel: string;
	slotHelp: string;
	slots: SlotInfo[];
	options: UpgradeOption[];
	initialOptionId?: string;
	onClose: () => void;
	onStart: (payload: StartPayload) => void;
}

type StartMode = "now" | "already";

const startModeIds: StartMode[] = ["now", "already"];

export function StartUpgradeFlyout(props: StartUpgradeFlyoutProps) {
	const {
		open,
		chief,
		title,
		description,
		selectLabel,
		selectHelp,
		timeLabel,
		speedLabel,
		speedPercent,
		slotLabel,
		slotHelp,
		slots,
		options,
		initialOptionId,
		onClose,
		onStart,
	} = props;
	const t = useTranslations("queues.start");
	const slotGroup = useId();
	const now = useNow(15_000);
	const [wasOpen, setWasOpen] = useState(false);
	const [optionId, setOptionId] = useState("");
	const [slotKey, setSlotKey] = useState("");
	const [mode, setMode] = useState<StartMode>("now");
	const [hours, setHours] = useState("");
	const [minutes, setMinutes] = useState("");
	const [takeCost, setTakeCost] = useState(true);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setOptionId(
				options.find((item) => item.id === initialOptionId)?.id ?? options[0]?.id ?? ""
			);
			setSlotKey("");
			setMode("now");
			setTakeCost(true);
		}
	}

	const option = options.find((item) => item.id === optionId);
	const optionSlots = slots.filter((slot) => option?.slotKeys.includes(slot.key));
	const idleSlots = optionSlots.filter((slot) => !slot.busyText);
	const chosenSlot = idleSlots.find((slot) => slot.key === slotKey) ?? idleSlots[0];
	const yourSeconds =
		option?.baseSeconds === undefined
			? 0
			: Math.floor(option.baseSeconds / (1 + speedPercent / 100));
	const typedSeconds = secondsFrom(Number(hours || 0), Number(minutes || 0));
	const seconds = mode === "now" ? yourSeconds : typedSeconds;
	const endsAt = new Date(now + seconds * 1_000);
	const short = option ? shortLines(chief, option.cost) : [];

	const startModes = startModeIds.map((id) => ({ id, label: t(`modes.${id}`) }));

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
			title={title ?? t("title")}
			description={description}
			footer={
				<>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button
						variant="primary"
						disabled={!option || !chosenSlot}
						onClick={() => {
							if (!option || !chosenSlot) return;
							const startedAt = new Date();
							onStart({
								optionId: option.id,
								slotKey: chosenSlot.key,
								startedAt,
								endsAt: new Date(startedAt.getTime() + seconds * 1_000),
								takeCost,
							});
						}}
					>
						{t("title")}
					</Button>
				</>
			}
		>
			{options.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("nothingToStart")}</p>
				</Card>
			) : (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{selectLabel}</h3>
						<Select
							data-autofocus
							aria-label={selectLabel}
							value={optionId}
							onChange={(event) => {
								setOptionId(event.target.value);
								setSlotKey("");
							}}
						>
							{options.map((item) => (
								<option key={item.id} value={item.id}>
									{item.label}
								</option>
							))}
						</Select>
						<p className="text-muted text-xs">{selectHelp}</p>
					</Card>

					{option && (
						<>
							<Card className="flex flex-col gap-3 p-4">
								<div className="flex items-center gap-3">
									<ItemIcon src={option.img} size={40} />
									<div className="flex flex-col">
										<span className="font-semibold">{option.name}</span>
										<span className="text-muted">{option.subtitle}</span>
									</div>
								</div>
								<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
									{option.cost.map((line) => (
										<li key={line.itemId} className="flex items-start gap-2">
											<ItemIcon src={findItem(line.itemId)?.img} size={20} />
											<span className="flex flex-col">
												<span className="text-muted text-xs">
													{line.name}
												</span>
												<span className="font-mono font-semibold">
													{formatNumber(line.amount)}
												</span>
											</span>
										</li>
									))}
								</ul>
								<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
									<span>{t("powerGained")}</span>
									<span className="text-kept font-mono font-medium">
										+{formatNumber(option.power)}
									</span>
								</div>
							</Card>

							<Card className="flex flex-col gap-2 p-4">
								<h3 className="font-semibold">{timeLabel}</h3>
								<div className="flex justify-between gap-3">
									<span>{t("packageTime")}</span>
									<span className="font-mono">
										{option.baseSeconds === undefined
											? t("unknown")
											: formatDuration(option.baseSeconds)}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>{speedLabel}</span>
									<span className="flex items-center gap-2">
										<span className="font-mono">{speedPercent}%</span>
										<Badge tone="added">{t("readOnly")}</Badge>
										<Link
											href="/bonuses"
											className="text-link text-xs underline"
										>
											{t("openBonuses")}
										</Link>
									</span>
								</div>
								<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
									<span className="font-semibold">{t("yourTime")}</span>
									<span className="text-primary font-mono font-semibold">
										{formatDuration(yourSeconds)}
									</span>
								</div>
								<p className="text-muted text-xs">{t("timeHint")}</p>
							</Card>

							<Card className="flex flex-col gap-2 p-4">
								<h3 className="font-semibold">{slotLabel}</h3>
								<ul className="flex flex-col gap-2">
									{optionSlots.map((slot) => {
										const busy = slot.busyText !== undefined;
										const selected = chosenSlot?.key === slot.key;
										return (
											<li key={slot.key}>
												<label
													className={`flex min-h-11 items-start gap-3 rounded-md border-[1.5px] p-3 ${
														busy
															? "border-line cursor-not-allowed opacity-70"
															: selected
																? "border-primary bg-tint cursor-pointer"
																: "border-line cursor-pointer"
													}`}
												>
													<input
														type="radio"
														name={slotGroup}
														className="mt-1 size-4"
														disabled={busy}
														checked={selected}
														onChange={() => setSlotKey(slot.key)}
													/>
													<span className="flex flex-col">
														<span className="font-medium">
															{slot.label}
														</span>
														{busy && (
															<span className="text-muted text-xs">
																{slot.busyText}
															</span>
														)}
													</span>
												</label>
											</li>
										);
									})}
								</ul>
								<p className="text-muted text-xs">
									{idleSlots.length === 0 ? t("allBusy") : slotHelp}
								</p>
							</Card>

							<Card className="flex flex-col gap-3 p-4">
								<h3 className="font-semibold">{t("whenStarted")}</h3>
								<SegmentedControl
									label={t("whenStarted")}
									options={startModes}
									value={mode}
									onChange={chooseMode}
								/>
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
								<p className="text-muted text-xs">{t("startedHint")}</p>
							</Card>

							<Card className="flex flex-col gap-2 p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex flex-col">
										<span className="font-semibold">{t("takeCost.title")}</span>
										<span className="text-muted text-xs">
											{t("takeCost.hint")}
										</span>
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
													names: short
														.map((line) => line.name)
														.join(", "),
												})}
									</p>
								)}
							</Card>
						</>
					)}
				</>
			)}
		</Flyout>
	);
}
