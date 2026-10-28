import { useTranslations } from "next-intl";
import { LuCheck, LuCircle } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dayLabelOf } from "@/service/coreEvents";
import { coreTodayOf } from "@/service/overviewEvents";
import { gameEventOf } from "@/data/game/coreEvents";
import { ButtonLink } from "@/comps/ui/Button";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

export function CoreTodayCard({
	chief,
	now,
	className,
}: {
	chief: Playthrough;
	now: number;
	className?: string;
}) {
	const t = useTranslations("overview.coreToday");
	const tCore = useTranslations("coreEvents.events");
	const today = coreTodayOf(chief, now);
	if (!today) return null;

	const dayLabel = dayLabelOf(today.event, today.dayId);
	const castleLabel = today.nextDayId ? dayLabelOf(today.event, today.nextDayId) : null;
	const CastleIcon = today.castleSignedUp ? LuCheck : LuCircle;

	return (
		<OverviewCard
			icon={<ItemIcon src={gameEventOf(today.event).img} size={32} />}
			title={t("title", { event: tCore(today.event) })}
			href="/core-events"
			linkLabel={t("open")}
			className={className}
		>
			<div className="flex flex-col">
				<span className="font-semibold">
					{t("dayLine", { day: dayLabel, name: today.dayName })}
				</span>
				<span className="text-muted font-mono text-xs">
					{t("plan", { points: formatNumber(today.planTotal) })}
				</span>
			</div>
			{today.actionCount === 0 ? (
				<p className="text-muted">{t("noActions")}</p>
			) : (
				<div className="flex flex-col gap-1.5">
					<div className="flex items-baseline justify-between gap-3">
						<span>{t("checklist")}</span>
						<span className="text-muted font-mono text-xs">
							{t("done", {
								done: formatNumber(today.actionsDone),
								total: formatNumber(today.actionCount),
							})}
						</span>
					</div>
					<ProgressBar
						value={today.actionsDone / today.actionCount}
						label={t("progress")}
					/>
				</div>
			)}
			{castleLabel && (
				<p className="bg-tint border-line flex items-center gap-2 rounded-md border-[1.5px] p-3">
					<CastleIcon size={16} aria-hidden="true" className="shrink-0" />
					{today.castleSignedUp
						? t("castleSignedUp", { day: castleLabel })
						: t("castleOpen", { day: castleLabel })}
				</p>
			)}
			<p className="text-muted">
				{t("logLocked", {
					locked: formatNumber(today.lockedDays),
					total: formatNumber(today.dayCount),
				})}{" "}
				{today.todayLocked
					? t("todayLocked", { day: dayLabel })
					: t("todayOpen", { day: dayLabel })}
			</p>
			<div className="flex flex-wrap gap-3">
				<ButtonLink href="/core-events">{t("openChecklist")}</ButtonLink>
				<ButtonLink href="/core-events">{t("openLog")}</ButtonLink>
			</div>
		</OverviewCard>
	);
}
