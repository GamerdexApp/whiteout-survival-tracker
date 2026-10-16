"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { FacilityView } from "@/service/allianceFacilities";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Switch } from "@/comps/ui/Switch";

interface FacilityCardsProps {
	views: FacilityView[];
	onOwnedChange: (facilityId: string, level: number, owned: boolean) => void;
}

function PercentChip({ label, value }: { label: string; value: number }) {
	return (
		<div className="border-line bg-tint flex flex-col rounded-md border-[1.5px] px-2 py-1">
			<span className="text-muted text-xs">{label}</span>
			<span className="font-mono font-semibold">{`${formatNumber(value)}%`}</span>
		</div>
	);
}

export function FacilityCards({ views, onOwnedChange }: FacilityCardsProps) {
	const t = useTranslations("facilities.card");

	return (
		<ul className="lg:columns-2 lg:gap-3 xl:columns-3">
			{views.map(({ facility, ownedCount, levels }) => (
				<li key={facility.id} className="mb-3 break-inside-avoid">
					<Card className="flex flex-col gap-3 p-4">
						<div className="flex items-center gap-3">
							<ItemIcon size={40} />
							<div className="flex min-w-0 flex-1 flex-col">
								<h3 className="font-semibold">{facility.name}</h3>
								<span className="text-muted">{facility.bonusStat}</span>
							</div>
							<span className="text-muted font-mono text-xs">
								{t("owned", { count: formatNumber(ownedCount) })}
							</span>
						</div>
						{levels.map(({ level, owned }) => (
							<div
								key={level.level}
								className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3"
							>
								<div className="flex items-center justify-between gap-3">
									<span className="font-semibold">
										{t("level", { level: formatNumber(level.level) })}
									</span>
									<span className="flex items-center gap-2">
										<span className="text-muted text-xs">
											{t("ownedSwitch")}
										</span>
										<Switch
											label={t("switchLabel", {
												facility: facility.name,
												level: formatNumber(level.level),
											})}
											checked={owned}
											onChange={(next) =>
												onOwnedChange(facility.id, level.level, next)
											}
										/>
									</span>
								</div>
								<div className="grid grid-cols-3 gap-2">
									<PercentChip
										label={t("booster")}
										value={level.boosterPercent}
									/>
									<PercentChip
										label={t("injured")}
										value={level.heavilyInjuredPercent}
									/>
									<PercentChip label={t("losses")} value={level.lossesPercent} />
								</div>
								<span className="text-muted text-xs">
									{t("ownLimit", {
										limit: formatNumber(level.ownLimit),
										spots: formatNumber(level.available),
										spotWord: level.available === 1 ? t("spot") : t("spots"),
									})}
								</span>
							</div>
						))}
					</Card>
				</li>
			))}
		</ul>
	);
}
