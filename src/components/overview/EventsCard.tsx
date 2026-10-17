import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dayLabelOf } from "@/service/coreEvents";
import { lengthText, timeText } from "@/service/eventsFormat";
import type { EventsZone } from "@/service/eventsSchedule";
import { liveCoreEventsOf, liveRunsOf, nextRunsOf } from "@/service/overviewEvents";
import type { UpcomingRun } from "@/service/overviewEvents";
import { CATEGORY_BORDER } from "@/comps/events/eventStyle";
import { ButtonLink } from "@/comps/ui/Button";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { OverviewCard } from "./OverviewCard";

interface EventsCardProps {
	chief: Playthrough;
	now: number;
	zone: EventsZone;
	className?: string;
}

const LIVE_BADGE =
	"bg-tint border-line text-link rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs whitespace-nowrap";

export function EventsCard({ chief, now, zone, className }: EventsCardProps) {
	const t = useTranslations("overview.events");
	const tCore = useTranslations("coreEvents.events");
	const tEvents = useTranslations("events");
	const liveCore = liveCoreEventsOf(chief, now);
	const liveRuns = liveRunsOf(chief, now, zone);
	const nextRuns = nextRunsOf(chief, now, zone);
	const hasEvents = (chief.userEvents ?? []).length > 0;

	const runName = (run: UpcomingRun) =>
		run.entry.state.runs.length > 1 && run.instance.label
			? tEvents("calendar.nameWithRun", {
					name: run.entry.event.name,
					run: run.instance.label,
				})
			: run.entry.event.name;

	const countdownText = (run: UpcomingRun) =>
		run.countdown.kind === "days"
			? tEvents("upcoming.inDays", {
					count: run.countdown.days,
					amount: formatNumber(run.countdown.days),
				})
			: tEvents(`upcoming.${run.countdown.kind}`);

	return (
		<OverviewCard
			title={t("title")}
			href="/events"
			linkLabel={t("openCalendar")}
			className={className}
		>
			{liveCore.length + liveRuns.length > 0 && (
				<section className="flex flex-col gap-2">
					<SectionLabel className="text-muted border-line border-b-[1.5px] pb-1">
						{t("liveNow")}
					</SectionLabel>
					<ul className="flex flex-col gap-3">
						{liveCore.map((live) => (
							<li key={live.event} className="border-primary border-s-[3px] ps-3">
								<Link href="/core-events" className="flex min-h-11 flex-col gap-1">
									<span className="flex items-center justify-between gap-2">
										<span className="font-semibold">{tCore(live.event)}</span>
										<span className={LIVE_BADGE}>{t("liveBadge")}</span>
									</span>
									<span className="text-muted">
										{t("coreLine", {
											day: dayLabelOf(live.event, live.todayId),
											count: formatNumber(live.dayCount),
											name: live.dayName,
										})}
									</span>
									<ProgressBar
										value={live.dayNumber / live.dayCount}
										label={tCore(live.event)}
									/>
								</Link>
							</li>
						))}
						{liveRuns.map((run) => (
							<li
								key={run.key}
								className={`border-s-[3px] ps-3 ${CATEGORY_BORDER[run.entry.event.category]}`}
							>
								<Link href="/events" className="flex min-h-11 flex-col gap-1">
									<span className="flex items-center justify-between gap-2">
										<span className="font-semibold">{runName(run)}</span>
										<span className={LIVE_BADGE}>{t("liveBadge")}</span>
									</span>
									<span className="text-muted">
										{t("runLine", {
											length: lengthText(
												run.entry.state.runs[run.instance.runIndex]
											),
										})}
									</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}
			{nextRuns.length > 0 && (
				<section className="flex flex-col gap-2">
					<SectionLabel className="text-muted border-line border-b-[1.5px] pb-1">
						{t("nextUp")}
					</SectionLabel>
					<ul className="flex flex-col gap-3">
						{nextRuns.map((run) => (
							<li
								key={run.key}
								className={`border-s-[3px] ps-3 ${CATEGORY_BORDER[run.entry.event.category]}`}
							>
								<Link
									href="/events"
									className="flex min-h-11 items-start justify-between gap-3"
								>
									<span className="flex min-w-0 flex-col">
										<span className="font-semibold">{runName(run)}</span>
										<span className="text-muted">
											{tEvents("upcoming.timeAndLength", {
												time: timeText(run.instance.startMs, zone),
												length: lengthText(
													run.entry.state.runs[run.instance.runIndex]
												),
											})}
										</span>
									</span>
									<span className="text-muted font-mono text-xs whitespace-nowrap">
										{countdownText(run)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}
			{!hasEvents && (
				<div className="flex flex-col items-start gap-2">
					<p className="text-muted">{t("empty")}</p>
					<ButtonLink href="/events">{t("addEvent")}</ButtonLink>
				</div>
			)}
			{hasEvents && liveCore.length + liveRuns.length + nextRuns.length === 0 && (
				<p className="text-muted">{t("noLive")}</p>
			)}
		</OverviewCard>
	);
}
