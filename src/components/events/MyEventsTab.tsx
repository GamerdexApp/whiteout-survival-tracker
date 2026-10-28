"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough, UserEventRepeat, UserEventState } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import { dateTimeText, lengthText, rangeText, timeText } from "@/service/eventsFormat";
import { resultsLiveInCoreEvents } from "@/service/eventsPage";
import type { EventEntry } from "@/service/eventsPage";
import { resultFor } from "@/service/eventsResults";
import {
	endedInstances,
	hasEnded,
	isDayLong,
	rollForward,
	runLengthMs,
} from "@/service/eventsSchedule";
import type { EventsZone } from "@/service/eventsSchedule";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { CATEGORY_BAR } from "./eventStyle";
import { EventTag } from "./EventTag";

interface MyEventsTabProps {
	chief: Playthrough;
	entries: EventEntry[];
	zone: EventsZone;
	nowMs: number;
	onEdit: (state: UserEventState) => void;
	onRemove: (state: UserEventState) => void;
}

export function useRepeatText() {
	const t = useTranslations("events");

	return (repeat: UserEventRepeat) => {
		if (repeat.kind === "none") return t("repeat.none");
		if (repeat.kind === "weekly") {
			const days = (repeat.weekdays ?? []).map((id) => t(`weekdays.short.${id as "monday"}`));
			return days.length === 0
				? t("repeat.weeklyAny")
				: t("repeat.weekly", { days: days.join(", ") });
		}
		const every = repeat.every ?? 1;
		return t(`repeat.every.${repeat.unit ?? "days"}`, {
			count: every,
			amount: formatDecimal(every),
		});
	};
}

export function MyEventsTab({ chief, entries, zone, nowMs, onEdit, onRemove }: MyEventsTabProps) {
	const t = useTranslations("events");
	const repeatText = useRepeatText();

	return (
		<>
			<p className="text-muted">
				{t("mine.intro", { count: entries.length, amount: formatNumber(entries.length) })}
			</p>
			<Card>
				<ul className="divide-line divide-y-[1.5px]">
					{entries.map(({ state, event }) => {
						const rolled = rollForward(state, nowMs);
						const ended = hasEnded(state, nowMs);
						const lastEnded = endedInstances(state, nowMs)[0];
						const logged =
							lastEnded !== undefined &&
							resultFor(
								chief,
								event.id,
								new Date(lastEnded.startMs).toISOString(),
								lastEnded.endMs
							) !== undefined;
						const coreOnly = resultsLiveInCoreEvents(event);
						return (
							<li
								key={event.id}
								className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
							>
								<div className="flex min-w-0 flex-1 flex-col gap-2">
									<h3 className="flex flex-wrap items-center gap-2">
										<span
											aria-hidden="true"
											className={`size-2.5 rounded-sm ${CATEGORY_BAR[event.category]}`}
										/>
										<ItemIcon src={event.img} size={24} />
										<span className="font-semibold">{event.name}</span>
										<span className="text-muted">
											{t(`categories.${event.category}`)}
										</span>
									</h3>
									<ul className="flex flex-col gap-1">
										{rolled.runs.map((run, index) => {
											const startMs = Date.parse(run.startsAt);
											const long = isDayLong({
												runIndex: index,
												startMs,
												endMs: startMs + runLengthMs(run),
											});
											return (
												<li
													key={index}
													className="flex flex-wrap gap-x-4 text-sm"
												>
													<span className="text-muted min-w-16 font-mono">
														{run.label ?? t("mine.run")}
													</span>
													<span className="font-mono">
														{long
															? t("mine.rangeLine", {
																	range: rangeText(
																		startMs,
																		startMs + runLengthMs(run),
																		zone
																	),
																	time: timeText(startMs, zone),
																})
															: t("mine.shortLine", {
																	when: dateTimeText(
																		startMs,
																		zone
																	),
																	length: lengthText(run),
																})}
													</span>
												</li>
											);
										})}
									</ul>
									<div className="flex flex-wrap gap-2">
										<EventTag>
											{t("mine.repeat", { rule: repeatText(state.repeat) })}
										</EventTag>
										<EventTag>{t(`gives.${state.gives}`)}</EventTag>
										{coreOnly && <EventTag>{t("mine.coreTag")}</EventTag>}
										{ended && <EventTag>{t("mine.ended")}</EventTag>}
										{logged && !coreOnly && (
											<EventTag>{t("mine.logged")}</EventTag>
										)}
									</div>
									{coreOnly && (
										<Link
											href="/core-events"
											className="text-link w-fit text-sm underline"
										>
											{t("mine.coreLink")}
										</Link>
									)}
								</div>
								<div className="flex gap-2">
									<Button onClick={() => onEdit(state)}>{t("mine.edit")}</Button>
									<Button variant="danger" onClick={() => onRemove(state)}>
										{t("mine.remove")}
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			</Card>
		</>
	);
}
