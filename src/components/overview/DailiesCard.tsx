import { useTranslations } from "next-intl";
import { LuSquare } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dailiesTodayOf } from "@/service/overviewEvents";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

export function DailiesCard({
	chief,
	now,
	className,
}: {
	chief: Playthrough;
	now: number;
	className?: string;
}) {
	const t = useTranslations("overview.dailies");
	const { summary, openTasks, openCount } = dailiesTodayOf(chief, now);

	return (
		<OverviewCard
			title={t("title")}
			href="/dailies"
			linkLabel={t("open")}
			className={className}
		>
			<div className="flex flex-col gap-1.5">
				<span className="font-mono text-sm">
					{t("activeness", {
						now: formatNumber(summary.activeness),
						top: formatNumber(summary.topReward),
					})}
				</span>
				<ProgressBar
					value={summary.topReward === 0 ? 0 : summary.activeness / summary.topReward}
					label={t("activenessBar")}
				/>
				<span className="text-muted">
					{t("missions", {
						done: formatNumber(summary.missionsDone),
						total: formatNumber(summary.missionsTotal),
					})}
				</span>
			</div>
			{summary.tasksTotal > 0 && (
				<div className="flex flex-col gap-1.5">
					<span className="font-mono text-sm">
						{t("tasks", {
							done: formatNumber(summary.tasksDone),
							total: formatNumber(summary.tasksTotal),
						})}
					</span>
					<ProgressBar
						value={summary.tasksDone / summary.tasksTotal}
						label={t("tasksBar")}
					/>
				</div>
			)}
			{summary.tasksTotal === 0 && <p className="text-muted">{t("noTasks")}</p>}
			{summary.tasksTotal > 0 && openCount === 0 && (
				<p className="text-muted">{t("allDone")}</p>
			)}
			{openCount > 0 && (
				<>
					<p className="text-muted">
						{t("stillOpen", {
							shown: formatNumber(openTasks.length),
							total: formatNumber(openCount),
						})}
					</p>
					<ul className="divide-line flex flex-col divide-y-[1.5px]">
						{openTasks.map((task) => (
							<li key={task.id} className="flex min-h-11 items-center gap-3">
								<LuSquare
									size={16}
									aria-hidden="true"
									className="text-muted shrink-0"
								/>
								{task.label}
							</li>
						))}
					</ul>
				</>
			)}
		</OverviewCard>
	);
}
