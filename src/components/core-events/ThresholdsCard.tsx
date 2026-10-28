import { useTranslations } from "next-intl";
import { LuCircle, LuCircleCheck } from "react-icons/lu";
import type { CoreEventId, Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { EventResult } from "@/service/coreEvents";
import { dayLabelOf, dayTotalOf, extraTierCountOf, milestonesOf } from "@/service/coreEvents";
import { Card } from "@/comps/ui/Card";
import { RewardLine } from "@/comps/ui/RewardLine";

interface ThresholdsCardProps {
	chief: Playthrough;
	event: CoreEventId;
	dayId: string;
	result: EventResult;
}

export function ThresholdsCard({ chief, event, dayId, result }: ThresholdsCardProps) {
	const t = useTranslations("coreEvents.thresholds");
	const milestones = milestonesOf(chief, event, dayId, dayTotalOf(result, dayId));
	const extraTiers = extraTierCountOf(chief, event, dayId);
	const hasNone = milestones.length === 0 && extraTiers === 0;
	const noneText = event === "king" || event === "hall" ? t("noneEvent") : t("noneDay");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
			</div>
			<p className="text-muted">{t("help", { day: dayLabelOf(event, dayId) })}</p>
			{hasNone && <p>{noneText}</p>}
			<ul className="flex flex-col">
				{milestones.map((milestone) => (
					<li
						key={milestone.name}
						className="border-line flex items-start gap-3 border-t-[1.5px] py-2 first:border-t-0"
					>
						{milestone.reached ? (
							<LuCircleCheck
								size={16}
								aria-hidden="true"
								className="text-kept mt-1 shrink-0"
							/>
						) : (
							<LuCircle
								size={16}
								aria-hidden="true"
								className="text-muted mt-1 shrink-0"
							/>
						)}
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="font-medium">{milestone.name}</span>
							<span className="text-muted flex flex-wrap gap-x-3 gap-y-1">
								{milestone.rewards.map((reward) => (
									<RewardLine key={reward.name} reward={reward} />
								))}
							</span>
						</div>
						<span
							className={`shrink-0 text-end font-mono text-xs ${milestone.reached ? "text-kept" : "text-muted"}`}
						>
							{milestone.reached
								? t("reached")
								: t("needs", { amount: formatNumber(milestone.missing) })}
						</span>
					</li>
				))}
				{Array.from({ length: extraTiers }, (_, index) => (
					<li
						key={index}
						className="border-line flex items-start gap-3 border-t-[1.5px] py-2 first:border-t-0"
					>
						<LuCircle
							size={16}
							aria-hidden="true"
							className="text-muted mt-1 shrink-0"
						/>
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="font-medium">
								{t("extraTier", { number: index + 1 })}
							</span>
							<span className="text-muted">{t("extraTierUnknown")}</span>
						</div>
						<span className="text-muted shrink-0 font-mono text-xs">
							{t("unknown")}
						</span>
					</li>
				))}
			</ul>
		</Card>
	);
}
