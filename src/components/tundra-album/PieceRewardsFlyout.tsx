"use client";

import { useTranslations } from "next-intl";
import { LuCheck } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { pieceRewardTiers, summarizePieceRewards } from "@/service/tundraAlbum";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { RewardLine } from "./RewardText";

interface PieceRewardsFlyoutProps {
	open: boolean;
	collected: number;
	available: number;
	onClose: () => void;
}

export function PieceRewardsFlyout({
	open,
	collected,
	available,
	onClose,
}: PieceRewardsFlyoutProps) {
	const t = useTranslations("tundraAlbum.rewardsFlyout");
	const tiers = pieceRewardTiers(collected);
	const summary = summarizePieceRewards(collected);

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={<Button onClick={onClose}>{t("close")}</Button>}
		>
			<Card className="flex flex-col gap-3 p-4">
				<div className="flex items-baseline justify-between gap-3">
					<span className="font-semibold">{t("collected")}</span>
					<span className="font-mono text-xl">
						{t("collectedValue", {
							collected: formatNumber(collected),
							available: formatNumber(available),
						})}
					</span>
				</div>
				<ProgressBar
					value={available === 0 ? 0 : collected / available}
					label={t("progress")}
				/>
				<p className="font-medium">
					{t("reached", {
						reached: formatNumber(summary.tiersReached),
						all: formatNumber(summary.tierCount),
					})}
				</p>
				<p className="text-muted">
					{summary.nextTierPieces === null
						? t("allReached")
						: t("next", {
								pieces: formatNumber(summary.nextTierPieces),
								missing: formatNumber(
									Math.max(0, summary.nextTierPieces - collected)
								),
							})}
				</p>
				{summary.totals.length > 0 && (
					<div className="flex flex-col gap-1">
						<span className="text-muted">{t("totalSoFar")}</span>
						<ul className="grid gap-1 sm:grid-cols-2">
							{summary.totals.map((total) => (
								<li key={total.itemId}>
									<RewardLine reward={total} />
								</li>
							))}
						</ul>
					</div>
				)}
			</Card>

			<Card className="p-4">
				<h3 className="mb-3 font-semibold">{t("tree")}</h3>
				<ol className="flex flex-col">
					{tiers.map((tier) => (
						<li
							key={tier.tier}
							className={`border-line relative flex gap-3 border-s-2 ps-4 pb-4 last:pb-0 ${tier.reached ? "border-primary" : ""}`}
						>
							<span
								aria-hidden="true"
								className={`absolute top-0.5 -left-1.75 flex size-3 items-center justify-center rounded-full border-2 ${tier.reached ? "border-primary bg-primary" : tier.next ? "border-primary bg-surface" : "border-line bg-surface"}`}
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<span className="font-semibold">
										{t("tier", {
											tier: formatNumber(tier.tier),
											pieces: formatNumber(tier.pieces),
										})}
									</span>
									<span
										className={`flex items-center gap-1 font-mono text-xs ${tier.reached ? "text-kept" : tier.next ? "text-primary" : "text-muted"}`}
									>
										{tier.reached && <LuCheck size={12} aria-hidden="true" />}
										{tier.reached
											? t("stateReached")
											: tier.next
												? t("stateNext", {
														missing: formatNumber(tier.missing),
													})
												: t("stateLater", {
														missing: formatNumber(tier.missing),
													})}
									</span>
								</div>
								<ul
									className={`flex flex-wrap gap-x-4 gap-y-1 ${tier.reached ? "" : "text-muted"}`}
								>
									{tier.rewards.map((reward) => (
										<li key={reward.itemId}>
											<RewardLine reward={reward} />
										</li>
									))}
								</ul>
							</div>
						</li>
					))}
				</ol>
			</Card>
		</Flyout>
	);
}
