"use client";

import { useTranslations } from "next-intl";
import type { Playthrough, TroopId } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import {
	callOfWarClaimedToday,
	callOfWarOf,
	callOfWarTierOf,
	msUntilNextUtcDay,
} from "@/service/troopCallOfWar";
import { TROOP_IDS } from "@/service/troops";
import { findTroop } from "@/data/game/troops";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

interface CallOfWarProps {
	chief: Playthrough;
	onClaim: (camp: TroopId) => void;
}

export function CallOfWar({ chief, onClaim }: CallOfWarProps) {
	const t = useTranslations("troops.callOfWar");
	const now = useNow(15_000);
	const callOfWar = callOfWarOf(chief);
	const claimed = callOfWarClaimedToday(chief, now);

	return (
		<section className="flex flex-col gap-2" aria-label={t("title")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted text-xs">{t("note")}</span>
			</div>
			<Card className="flex flex-col gap-3 p-4">
				{callOfWar === null ? (
					<p className="text-muted">{t("notUnlocked")}</p>
				) : (
					<>
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<span className="font-semibold">
								{t("available", { troops: formatNumber(callOfWar.troops) })}
							</span>
							<span className="text-muted font-mono text-xs">
								{t("level", { level: formatNumber(callOfWar.skillLevel) })}
							</span>
						</div>
						{claimed && (
							<p className="text-muted">
								{t("claimed", {
									time: formatDuration(msUntilNextUtcDay(now) / 1_000),
								})}
							</p>
						)}
						<div className="grid gap-3 md:grid-cols-3">
							{TROOP_IDS.map((camp) => {
								const tier = callOfWarTierOf(chief, camp);
								return (
									<div key={camp} className="flex flex-col gap-1">
										<Button
											disabled={claimed || tier === null}
											onClick={() => onClaim(camp)}
										>
											{t("add", { camp: findTroop(camp)?.name ?? camp })}
										</Button>
										<span className="text-muted text-xs">
											{tier === null
												? t("noTier")
												: t("addHint", {
														troops: formatNumber(callOfWar.troops),
														tier,
													})}
										</span>
									</div>
								);
							})}
						</div>
					</>
				)}
			</Card>
		</section>
	);
}
