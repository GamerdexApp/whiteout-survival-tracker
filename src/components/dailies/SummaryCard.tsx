"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import { secondsToNextReset, utcClock } from "@/service/dailies";
import type { DailiesSummary } from "@/service/dailies";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { useResetTimeLabel } from "./resetTime";

interface SummaryCardProps {
	summary: DailiesSummary;
	resetTime: string;
	nowMs: number;
	onReset: () => void;
}

interface MetricProps {
	label: string;
	value: string;
	bar: { value: number; label: string };
	note: string;
}

function Metric({ label, value, bar, note }: MetricProps) {
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<span className="text-muted font-mono text-xs tracking-[0.06em] uppercase">
				{label}
			</span>
			<span className="text-xl font-semibold lg:text-2xl">{value}</span>
			<ProgressBar value={bar.value} label={bar.label} />
			<span className="text-muted max-lg:hidden">{note}</span>
		</div>
	);
}

export function SummaryCard({ summary, resetTime, nowMs, onReset }: SummaryCardProps) {
	const t = useTranslations("dailies");
	const timeLabel = useResetTimeLabel();
	const left = formatDuration(secondsToNextReset(nowMs, resetTime));
	const next =
		summary.nextReward === null
			? t("summary.activenessTop")
			: t("summary.activenessNext", {
					level: formatNumber(summary.nextReward),
					gap: formatNumber(summary.toNextReward),
				});

	return (
		<Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
			<div className="flex flex-1 flex-col gap-3">
				<div className="grid grid-cols-3 gap-4">
					<Metric
						label={t("summary.missions")}
						value={t("summary.missionsValue", {
							done: formatNumber(summary.missionsDone),
							total: formatNumber(summary.missionsTotal),
						})}
						bar={{
							value: summary.missionsDone / summary.missionsTotal,
							label: t("summary.missionsBar"),
						}}
						note={t("summary.missionsNote")}
					/>
					<Metric
						label={t("summary.activeness")}
						value={t("summary.activenessValue", {
							amount: formatNumber(summary.activeness),
							total: formatNumber(summary.topReward),
						})}
						bar={{
							value: summary.activeness / summary.topReward,
							label: t("summary.activenessBar"),
						}}
						note={next}
					/>
					<Metric
						label={t("summary.tasks")}
						value={t("summary.tasksValue", {
							done: formatNumber(summary.tasksDone),
							total: formatNumber(summary.tasksTotal),
						})}
						bar={{
							value:
								summary.tasksTotal === 0
									? 0
									: summary.tasksDone / summary.tasksTotal,
							label: t("summary.tasksBar"),
						}}
						note={t("summary.tasksNote")}
					/>
				</div>
				<p className="text-muted lg:hidden">{next}</p>
			</div>
			<div className="flex flex-col items-start gap-2 lg:max-w-60">
				<p className="text-muted">
					{t("reset.summary", { time: timeLabel(resetTime), left })}{" "}
					<span className="max-lg:hidden">
						{t("reset.clock", { now: utcClock(nowMs) })}
					</span>
				</p>
				<Button variant="danger" onClick={onReset}>
					{t("reset.button")}
				</Button>
				<span className="text-muted max-lg:hidden">{t("reset.note")}</span>
			</div>
		</Card>
	);
}
