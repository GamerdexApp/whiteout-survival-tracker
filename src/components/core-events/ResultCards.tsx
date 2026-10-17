import { useTranslations } from "next-intl";
import type { CoreEventId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { EventResult } from "@/service/coreEvents";
import { dayLabelOf, dayTotalOf } from "@/service/coreEvents";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface ResultCardProps {
	event: CoreEventId;
	dayId: string;
	result: EventResult;
}

export function TotalCard({ event, dayId, result }: ResultCardProps) {
	const t = useTranslations("coreEvents.result");
	const isHall = event === "hall";
	const dayResult = result.days.find((day) => day.id === dayId);
	const score = isHall && dayResult ? dayResult : result.event;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<SectionLabel className="text-muted">
				{isHall ? t("totalTitleHall") : t("totalTitle")}
			</SectionLabel>
			<span className="font-mono text-3xl font-semibold">{formatNumber(score.total)}</span>
			<span className="text-muted">
				{t("baseBonus", {
					base: formatNumber(score.base),
					bonus: formatNumber(score.bonus),
				})}
			</span>
			{isHall && (
				<span className="text-muted text-sm">
					{t("seasonSum", { amount: formatNumber(result.event.total) })}
				</span>
			)}
			{result.battle && (
				<div className="border-line flex flex-col gap-1 border-t-[1.5px] pt-3">
					<span className="text-muted font-mono text-sm">{t("battle")}</span>
					<div className="flex flex-wrap items-baseline gap-x-3">
						<span className="font-mono text-xl font-semibold">
							{formatNumber(result.battle.total)}
						</span>
						<span className="text-muted">{t("battleNoBonus")}</span>
					</div>
				</div>
			)}
			{!isHall && dayResult && (
				<div className="border-line flex flex-wrap items-baseline justify-between gap-x-3 border-t-[1.5px] pt-3">
					<span className="font-mono text-sm">
						{t("selectedDayTotal", {
							day: dayLabelOf(event, dayId),
							amount: formatNumber(dayResult.total),
						})}
					</span>
					{dayResult.bonus > 0 && (
						<span className="text-muted">
							{t("selectedDayBonus", { percent: result.bonusPercent })}
						</span>
					)}
				</div>
			)}
		</Card>
	);
}

export function PerDayCard({ event, dayId, result }: ResultCardProps) {
	const t = useTranslations("coreEvents.perDay");
	const largest = Math.max(1, ...result.days.map((day) => day.total));

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{event === "hall" ? t("titleHall") : t("title")}</h2>
			<ul className="flex flex-col gap-2">
				{result.days.map((day) => {
					const label = dayLabelOf(event, day.id);
					return (
						<li
							key={day.id}
							className="grid grid-cols-[4.5rem_1fr_6rem] items-center gap-3 text-sm"
						>
							<span className={day.id === dayId ? "font-semibold" : "text-muted"}>
								{label}
							</span>
							<ProgressBar
								value={day.total / largest}
								label={t("bar", { day: label })}
								className="h-2"
							/>
							<span className="text-end font-mono">
								{formatNumber(dayTotalOf(result, day.id))}
							</span>
						</li>
					);
				})}
			</ul>
		</Card>
	);
}
