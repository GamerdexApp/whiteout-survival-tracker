"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { buildRewardLevelViews } from "@/service/dailies";
import {
	ALL_LEVELS_ACTIVENESS,
	itemName,
	LEVEL_ONE_ACTIVENESS,
	rewardLevels,
	TOP_REWARD_ACTIVENESS,
} from "@/data/game/dailies";
import { Card } from "@/comps/ui/Card";
import { RewardAmounts } from "./RewardAmounts";

const percentOf = (activeness: number) => Math.min(100, (activeness / TOP_REWARD_ACTIVENESS) * 100);

export function ActivityCard({ activeness }: { activeness: number }) {
	const t = useTranslations("dailies.activity");
	const views = buildRewardLevelViews(activeness);

	return (
		<Card>
			<div className="flex flex-col gap-3 p-4">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold">{t("title")}</h2>
					<p className="text-muted">{t("intro")}</p>
				</div>
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<span className="font-mono text-xl">
						{t("today", {
							amount: formatNumber(activeness),
							total: formatNumber(TOP_REWARD_ACTIVENESS),
						})}
					</span>
					<span className="text-muted">
						{t("percent", { percent: formatNumber(Math.round(percentOf(activeness))) })}
					</span>
				</div>
				<div className="px-3 pt-1 pb-6">
					<div
						role="img"
						aria-label={t("bar")}
						className="bg-track relative h-2 rounded-full"
					>
						<div
							className="bg-primary h-full rounded-full"
							style={{ width: `${percentOf(activeness)}%` }}
						/>
						{rewardLevels.map((level) => {
							const reached = level.activeness <= activeness;
							return (
								<span
									key={level.activeness}
									className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
									style={{ left: `${percentOf(level.activeness)}%` }}
								>
									<span
										className={`block size-3.5 rounded-full border-[1.5px] ${
											reached
												? "border-primary bg-primary"
												: "border-line bg-surface"
										}`}
									/>
									<span className="text-muted absolute top-5 left-1/2 -translate-x-1/2 font-mono text-xs">
										{formatNumber(level.activeness)}
									</span>
								</span>
							);
						})}
					</div>
				</div>
				<p className="text-muted">
					{t("known", {
						all: formatNumber(ALL_LEVELS_ACTIVENESS),
						first: formatNumber(LEVEL_ONE_ACTIVENESS),
						top: formatNumber(TOP_REWARD_ACTIVENESS),
					})}
				</p>
				<h3 className="font-medium">{t("rewards")}</h3>
			</div>
			<ul className="border-line border-t-[1.5px]">
				{views.map((view) => (
					<li
						key={view.activeness}
						className={`border-line grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1 px-4 py-3 not-last:border-b-[1.5px] sm:grid-cols-[3rem_9rem_1fr] ${
							view.status === "next" ? "bg-tint" : ""
						}`}
					>
						<span className="font-mono font-medium">
							{formatNumber(view.activeness)}
						</span>
						<span className={view.status === "reached" ? "text-kept" : "text-muted"}>
							{view.status === "reached"
								? t("reached")
								: view.status === "next"
									? t("next", { gap: formatNumber(view.remaining) })
									: t("ahead", { gap: formatNumber(view.remaining) })}
						</span>
						<span className="col-span-2 sm:col-span-1">
							<RewardAmounts rewards={view.rewards} />
						</span>
					</li>
				))}
			</ul>
		</Card>
	);
}
