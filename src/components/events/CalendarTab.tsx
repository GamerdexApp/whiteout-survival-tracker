"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { monthTitleText, timeText } from "@/service/eventsFormat";
import type { EventEntry } from "@/service/eventsPage";
import {
	DAY_MS,
	dayNumberOf,
	instancesBetween,
	isDayLong,
	monthGrid,
	WEEKDAY_IDS,
	zoneParts,
} from "@/service/eventsSchedule";
import type { CalendarDay, EventsZone, RunInstance } from "@/service/eventsSchedule";
import { EVENT_CATEGORIES } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { IconButton } from "@/comps/ui/IconButton";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { CATEGORY_BAR, CATEGORY_BORDER } from "./eventStyle";
import { UpcomingList } from "./UpcomingList";

interface CalendarTabProps {
	entries: EventEntry[];
	cycles: ReactNode;
	zone: EventsZone;
	nowMs: number;
	onZone: (zone: EventsZone) => void;
}

interface DayChip {
	entry: EventEntry;
	instance: RunInstance;
}

const chipsOfDay = (day: CalendarDay, chips: DayChip[]) =>
	chips
		.filter(({ instance }) => instance.startMs < day.endMs && instance.endMs > day.startMs)
		.sort((a, b) => a.instance.startMs - b.instance.startMs);

export function CalendarTab({ entries, cycles, zone, nowMs, onZone }: CalendarTabProps) {
	const t = useTranslations("events");
	const [offset, setOffset] = useState(0);

	const current = zoneParts(nowMs, zone);
	const first = new Date(Date.UTC(current.year, current.month + offset, 1));
	const year = first.getUTCFullYear();
	const month = first.getUTCMonth();
	const days = monthGrid(year, month, zone);
	const windowStart = days[0].startMs;
	const windowEnd = days[days.length - 1].endMs;
	const chips: DayChip[] = entries.flatMap((entry) =>
		instancesBetween(entry.state, nowMs, windowStart, windowEnd).map((instance) => ({
			entry,
			instance,
		}))
	);
	const todayNumber = dayNumberOf(nowMs, zone);

	const chipParts = ({ entry, instance }: DayChip, day: CalendarDay) => {
		const name =
			entry.state.runs.length > 1 && instance.label
				? t("calendar.nameWithRun", { name: entry.event.name, run: instance.label })
				: entry.event.name;
		if (!isDayLong(instance)) return { name, tail: timeText(instance.startMs, zone) };
		const startNumber = dayNumberOf(instance.startMs, zone);
		const dayNumber = Math.round(Date.UTC(day.year, day.month, day.day) / DAY_MS);
		return {
			name,
			tail: t("calendar.dayTail", { day: formatNumber(dayNumber - startNumber + 1) }),
		};
	};

	const chipText = (chip: DayChip, day: CalendarDay) => {
		const { name, tail } = chipParts(chip, day);
		return t("calendar.chipText", { name, tail });
	};

	return (
		<>
			{cycles}
			<Card className="flex flex-col gap-3 p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<IconButton
							label={t("calendar.previous")}
							className="border-line bg-surface hover:bg-tint border-[1.5px]"
							onClick={() => setOffset(offset - 1)}
						>
							<LuChevronLeft size={18} aria-hidden="true" />
						</IconButton>
						<h2 className="min-w-36 text-center text-lg font-semibold">
							{monthTitleText(year, month)}
						</h2>
						<IconButton
							label={t("calendar.next")}
							className="border-line bg-surface hover:bg-tint border-[1.5px]"
							onClick={() => setOffset(offset + 1)}
						>
							<LuChevronRight size={18} aria-hidden="true" />
						</IconButton>
						<Button className="max-lg:hidden" onClick={() => setOffset(0)}>
							{t("calendar.today")}
						</Button>
					</div>
					<div className="max-lg:w-full max-lg:[&_label]:flex-1 max-lg:[&_label]:justify-center max-lg:[&>fieldset]:flex">
						<SegmentedControl
							label={t("calendar.zoneLabel")}
							value={zone}
							onChange={onZone}
							options={[
								{ id: "utc", label: t("calendar.utc") },
								{ id: "local", label: t("calendar.local") },
							]}
						/>
					</div>
				</div>
				<ul className="flex flex-wrap gap-x-4 gap-y-1 max-lg:order-last">
					{EVENT_CATEGORIES.map((category) => (
						<li key={category} className="text-muted flex items-center gap-1.5">
							<span
								aria-hidden="true"
								className={`size-2.5 rounded-sm ${CATEGORY_BAR[category]}`}
							/>
							{t(`categories.${category}`)}
						</li>
					))}
				</ul>
				<div className="border-line grid grid-cols-7 border-[1.5px] max-lg:border-0">
					{WEEKDAY_IDS.map((id) => (
						<div
							key={id}
							className="border-line text-muted border-b-[1.5px] px-2 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase max-lg:justify-self-center max-lg:border-0 lg:border-l-[1.5px] lg:first:border-l-0"
						>
							<span className="max-lg:hidden">{t(`weekdays.short.${id}`)}</span>
							<span aria-hidden="true" className="lg:hidden">
								{t(`weekdays.initial.${id}`)}
							</span>
							<span className="sr-only lg:hidden">{t(`weekdays.short.${id}`)}</span>
						</div>
					))}
					{days.map((day) => {
						const dayChips = chipsOfDay(day, chips);
						const isToday =
							Math.round(Date.UTC(day.year, day.month, day.day) / DAY_MS) ===
							todayNumber;
						return (
							<div
								key={day.key}
								className={`border-line relative flex min-w-0 flex-col gap-1 p-1.5 max-lg:items-center max-lg:py-2 lg:min-h-26 lg:border-t-[1.5px] lg:border-l-[1.5px] lg:nth-[7n+1]:border-l-0 ${
									day.inMonth ? "" : "bg-tint/50 text-muted"
								}`}
							>
								<span
									className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-mono text-sm max-lg:text-base ${
										isToday ? "bg-primary text-on-primary lg:w-full" : ""
									}`}
								>
									{formatNumber(day.day)}
								</span>
								<ul className="flex flex-col gap-0.5 max-lg:hidden">
									{dayChips.map((chip) => (
										<li
											key={`${chip.entry.event.id}-${chip.instance.runIndex}-${chip.instance.startMs}`}
											className={`bg-tint flex gap-1 rounded-sm border-l-[3px] px-1.5 py-0.5 text-xs ${CATEGORY_BORDER[chip.entry.event.category]}`}
										>
											<span className="truncate">
												{chipParts(chip, day).name}
											</span>
											<span className="shrink-0 font-mono">
												{chipParts(chip, day).tail}
											</span>
										</li>
									))}
								</ul>
								{dayChips.length > 0 && (
									<>
										<span aria-hidden="true" className="flex gap-0.5 lg:hidden">
											{dayChips.slice(0, 3).map((chip) => (
												<span
													key={`${chip.entry.event.id}-${chip.instance.runIndex}-${chip.instance.startMs}`}
													className={`size-1.5 rounded-full ${CATEGORY_BAR[chip.entry.event.category]}`}
												/>
											))}
										</span>
										<span className="sr-only lg:hidden">
											{dayChips.map((chip) => chipText(chip, day)).join(", ")}
										</span>
									</>
								)}
							</div>
						);
					})}
				</div>
			</Card>
			<UpcomingList entries={entries} zone={zone} nowMs={nowMs} />
		</>
	);
}
