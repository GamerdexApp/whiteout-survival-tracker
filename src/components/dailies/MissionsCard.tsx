"use client";

import { useTranslations } from "next-intl";
import type { DailiesState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { buildMissionViews } from "@/service/dailies";
import type { MissionView } from "@/service/dailies";
import { Card } from "@/comps/ui/Card";
import { Switch } from "@/comps/ui/Switch";
import { LevelPicker } from "./LevelPicker";
import { RewardAmounts } from "./RewardAmounts";
import type { DailiesActions } from "./useDailiesActions";

interface MissionsCardProps {
	state: DailiesState;
	cycle: string;
	actions: DailiesActions;
}

export function MissionsCard({ state, cycle, actions }: MissionsCardProps) {
	const t = useTranslations("dailies.missions");
	const views = buildMissionViews(state, cycle);
	const doneCount = views.filter((view) => view.level > 0).length;

	return (
		<Card>
			<div className="border-line flex items-start justify-between gap-3 border-b-[1.5px] p-4">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold">{t("title")}</h2>
					<p className="text-muted">{t("intro")}</p>
				</div>
				<span className="text-muted shrink-0 font-mono text-xs">
					{t("count", {
						done: formatNumber(doneCount),
						total: formatNumber(views.length),
					})}
				</span>
			</div>
			<ul>
				{views.map((view) => (
					<MissionRow
						key={view.id}
						view={view}
						onLevel={(level) => actions.setLevel(view.id, level)}
					/>
				))}
			</ul>
		</Card>
	);
}

function MissionRow({ view, onLevel }: { view: MissionView; onLevel: (level: number) => void }) {
	const t = useTranslations("dailies.missions");
	const shownLevel = Math.max(view.level, 1);
	const hasLevels = view.knownLevels > 1;
	const paidLevels = view.levelActiveness.slice(0, view.level).map(formatNumber);
	const breakdown =
		view.knownLevels > 1
			? t("breakdown", { terms: view.levelActiveness.map(formatNumber).join(" + ") })
			: "";
	const activenessLine =
		view.level === 0
			? t("activenessNone", { max: formatNumber(view.activenessMax), breakdown })
			: view.level === 1
				? t("activenessOne", {
						now: formatNumber(view.activenessNow),
						max: formatNumber(view.activenessMax),
						breakdown,
					})
				: t("activenessSum", {
						sum: paidLevels.join(" + "),
						now: formatNumber(view.activenessNow),
						max: formatNumber(view.activenessMax),
						breakdown,
					});
	const rewards = <RewardAmounts rewards={view.otherRewards} />;
	return (
		<li className="border-line flex flex-col gap-3 p-4 not-last:border-b-[1.5px] lg:flex-row lg:items-start lg:justify-between">
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-semibold">{view.name}</h3>
					{view.level > 0 && (
						<span className="border-kept text-kept rounded-sm border-[1.5px] px-1.5 font-mono text-xs">
							{hasLevels
								? t("levelDone", { level: formatNumber(view.level) })
								: t("doneBadge")}
						</span>
					)}
				</div>
				<p>
					{hasLevels
						? t("task", {
								level: formatNumber(shownLevel),
								task: view.levelTask,
								target: formatNumber(view.levelTarget),
							})
						: t("taskSingle", {
								task: view.levelTask,
								target: formatNumber(view.levelTarget),
							})}
				</p>
				<p className="text-muted">{activenessLine}</p>
				<p className="text-muted">
					{view.knownLevels > 1
						? t.rich("alsoGivesEach", { rewards: () => rewards })
						: t.rich("alsoGives", { rewards: () => rewards })}
				</p>
			</div>
			<div className="flex shrink-0 items-center justify-between gap-3 lg:flex-col lg:items-end">
				{hasLevels ? (
					<LevelPicker
						name={view.name}
						level={view.level}
						knownLevels={view.knownLevels}
						onChange={onLevel}
					/>
				) : (
					<span className="flex items-center gap-2">
						<span className="text-muted text-xs">{t("doneToday")}</span>
						<Switch
							label={t("doneFor", { name: view.name })}
							checked={view.level > 0}
							onChange={(checked) => onLevel(checked ? 1 : 0)}
						/>
					</span>
				)}
				<span className="font-mono text-xs">
					{t("amount", {
						now: formatNumber(view.activenessNow),
						max: formatNumber(view.activenessMax),
					})}
				</span>
			</div>
		</li>
	);
}
