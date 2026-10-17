"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { lengthText, timeText, weekdayDayText } from "@/service/eventsFormat";
import type { EventEntry } from "@/service/eventsPage";
import { countdownOf, upcomingGroups } from "@/service/eventsPage";
import type { EventsZone } from "@/service/eventsSchedule";
import { Card } from "@/comps/ui/Card";
import { CATEGORY_BORDER } from "./eventStyle";
import { EventTag } from "./EventTag";

interface UpcomingListProps {
	entries: EventEntry[];
	zone: EventsZone;
	nowMs: number;
}

export function UpcomingList({ entries, zone, nowMs }: UpcomingListProps) {
	const t = useTranslations("events");
	const groups = upcomingGroups(entries, nowMs, zone);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="text-lg font-semibold">{t("upcoming.title")}</h2>
			{groups.length === 0 ? (
				<p className="text-muted">{t("upcoming.empty")}</p>
			) : (
				<div className="grid gap-x-6 gap-y-4 lg:grid-cols-3 lg:items-start">
					{groups.map((group) => {
						const countdown = countdownOf(group.items[0].instance, nowMs, zone);
						return (
							<section
								key={group.dayNumber}
								className="border-line flex flex-col gap-2 border-t-[1.5px] pt-2"
							>
								<header className="flex items-baseline justify-between gap-2">
									<h3 className="font-semibold">
										{weekdayDayText(group.startMs, zone)}
									</h3>
									<span className="text-muted">
										{countdown.kind === "days"
											? t("upcoming.inDays", {
													count: countdown.days,
													amount: formatNumber(countdown.days),
												})
											: t(`upcoming.${countdown.kind}`)}
									</span>
								</header>
								<ul className="flex flex-col gap-2">
									{group.items.map(({ entry, instance }) => (
										<li
											key={`${entry.event.id}-${instance.runIndex}-${instance.startMs}`}
											className={`flex items-start justify-between gap-2 border-s-[3px] ps-2.5 ${CATEGORY_BORDER[entry.event.category]}`}
										>
											<div className="flex min-w-0 flex-col">
												<span className="font-semibold">
													{entry.state.runs.length > 1 && instance.label
														? t("calendar.nameWithRun", {
																name: entry.event.name,
																run: instance.label,
															})
														: entry.event.name}
												</span>
												<span className="text-muted font-mono text-xs">
													{t("upcoming.timeAndLength", {
														time: timeText(instance.startMs, zone),
														length: lengthText(
															entry.state.runs[instance.runIndex]
														),
													})}
												</span>
											</div>
											<EventTag>{t(`gives.${entry.state.gives}`)}</EventTag>
										</li>
									))}
								</ul>
							</section>
						);
					})}
				</div>
			)}
		</Card>
	);
}
