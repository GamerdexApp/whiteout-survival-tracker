import { useTranslations } from "next-intl";
import { LuCheck } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import type { MilestoneView } from "@/service/labyrinth";
import { labyrinthRewards, labyrinthShop } from "@/data/game/labyrinth";
import { Card } from "@/comps/ui/Card";
import { RewardLine } from "./RewardLine";

export function MilestonesCard({
	milestones,
	cores,
}: {
	milestones: MilestoneView[];
	cores: number;
}) {
	const t = useTranslations("labyrinth.milestones");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<p className="text-muted">{t("hint", { cores: formatNumber(cores) })}</p>
			<ul className="flex flex-col">
				{milestones.map(({ milestone, reached }) => (
					<li
						key={milestone.name}
						className="border-line flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] py-2 first:border-t-0"
					>
						<div className="flex flex-col gap-0.5">
							<span className={reached ? "text-muted" : "font-semibold"}>
								{milestone.name}
							</span>
							{milestone.rewards?.map((reward) => (
								<RewardLine key={reward.name} reward={reward} />
							))}
						</div>
						{reached ? (
							<span className="text-kept inline-flex items-center gap-1 font-mono text-sm">
								<LuCheck aria-hidden="true" size={14} />
								{t("reached")}
							</span>
						) : (
							<span className="text-muted font-mono text-sm">
								{t("needsMore", {
									amount: formatNumber((milestone.scoreTotal ?? 0) - cores),
								})}
							</span>
						)}
					</li>
				))}
			</ul>
		</Card>
	);
}

export function ShopCard() {
	const t = useTranslations("labyrinth.shop");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<p className="text-muted">{t("hint")}</p>
			<ul className="flex flex-col">
				{labyrinthShop.map(({ reward, cost, limit }) => (
					<li
						key={reward.name}
						className="border-line flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] py-2 first:border-t-0"
					>
						<RewardLine reward={reward} />
						<span className="text-muted font-mono text-sm">
							{t("cost", { amount: formatNumber(cost) })} ·{" "}
							{t("limit", { amount: formatNumber(limit) })}
						</span>
					</li>
				))}
			</ul>
		</Card>
	);
}

export function RaidRewardsCard() {
	const t = useTranslations("labyrinth.rewards");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("raidTitle")}</h2>
			<ul className="flex flex-col gap-2">
				{labyrinthRewards.map((reward) => (
					<li key={reward.name} className="flex flex-col gap-0.5">
						<RewardLine reward={reward} />
						{reward.note && <span className="text-muted text-sm">{reward.note}</span>}
					</li>
				))}
			</ul>
		</Card>
	);
}
