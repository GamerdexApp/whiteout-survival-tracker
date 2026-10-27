"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { msUntilNextUtcDay } from "@/service/utcDay";
import { MAX_STREAK_DAY } from "@/service/vip";
import type { VipSignIn } from "@/service/vip";
import { CountInput } from "@/comps/troops/CountInput";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface VipSignInCardProps {
	signIn: (now: number) => VipSignIn;
	hasXp: boolean;
	onAdd: () => void;
	onStreakDay: (streakDay: number) => void;
}

export function VipSignInCard({ signIn, hasXp, onAdd, onStreakDay }: VipSignInCardProps) {
	const t = useTranslations("vip.signIn");
	const now = useNow(15_000);
	const today = signIn(now);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted text-xs">{t("note")}</span>
			</div>
			{today.claimedToday ? (
				<p className="text-muted">
					{t("claimed", {
						streak: formatNumber(today.streak),
						points: formatNumber(today.tomorrowPoints),
						time: formatDuration(msUntilNextUtcDay(now) / 1_000),
					})}
				</p>
			) : (
				<div className="flex flex-col items-start gap-1">
					<Button disabled={!hasXp} onClick={onAdd}>
						{t("add")}
					</Button>
					<span className="text-muted text-xs">
						{hasXp
							? t("addHint", {
									streak: formatNumber(today.streak),
									points: formatNumber(today.points),
								})
							: t("needXp")}
					</span>
				</div>
			)}
			<div className="flex flex-col items-start gap-1.5">
				<SectionLabel className="text-muted">{t("streakLabel")}</SectionLabel>
				<span className="w-24">
					<CountInput
						label={t("streakLabel")}
						value={today.streak}
						min={1}
						max={MAX_STREAK_DAY}
						onCommit={onStreakDay}
					/>
				</span>
				<span className="text-muted text-xs">{t("streakHint")}</span>
			</div>
		</Card>
	);
}
