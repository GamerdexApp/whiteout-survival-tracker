"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	prestigeGatheringPercent,
	prestigeTierOf,
	prestigeTierPercent,
} from "@/service/alliancePrestige";
import { prestigeBuildings } from "@/data/game/alliance";
import { Card } from "@/comps/ui/Card";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";

const NO_TIER = "none";

interface PrestigeCardProps {
	chief: Playthrough;
	onTierChange: (buildingId: string, tier: string | null) => void;
}

export function PrestigeCard({ chief, onTierChange }: PrestigeCardProps) {
	const t = useTranslations("alliance.prestige");

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title")}</h2>
				<p className="text-muted">{t("description")}</p>
			</div>
			<ul className="divide-line flex flex-col divide-y-[1.5px]">
				{prestigeBuildings.map((building) => {
					const tier = prestigeTierOf(chief, building.id);
					const bonus = t("bonus", {
						value: formatNumber(prestigeTierPercent(building.id, tier)),
					});
					return (
						<li
							key={building.id}
							className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
						>
							<span className="flex items-start justify-between gap-3">
								<span className="flex min-w-0 flex-col">
									<span className="font-semibold">{building.name}</span>
									<span className="text-muted text-xs">
										{building.source.requirement === undefined
											? building.source.event
											: t("source", {
													event: building.source.event,
													requirement: building.source.requirement,
												})}
									</span>
								</span>
								<span className="font-mono text-xs md:hidden">{bonus}</span>
							</span>
							<span className="flex items-center gap-3">
								<span className="hidden w-12 shrink-0 text-end font-mono text-xs md:block">
									{bonus}
								</span>
								<span className="w-full md:w-auto [&_label]:flex-1 [&_label]:whitespace-nowrap md:[&_label]:flex-none [&>fieldset]:flex [&>fieldset]:w-full md:[&>fieldset]:inline-flex md:[&>fieldset]:w-auto">
									<SegmentedControl
										label={t("tierLabel", { name: building.name })}
										options={[
											{ id: NO_TIER, label: t("none") },
											...building.levels.map((level) => ({
												id: level.name,
												label: level.name,
											})),
										]}
										value={tier ?? NO_TIER}
										onChange={(next) =>
											onTierChange(
												building.id,
												next === NO_TIER ? null : next
											)
										}
									/>
								</span>
							</span>
						</li>
					);
				})}
			</ul>
			<div className="border-line flex items-center justify-between gap-3 border-t-[1.5px] pt-3">
				<span className="font-semibold">{t("total")}</span>
				<span className="text-primary font-mono font-semibold">
					{t("totalValue", { value: formatNumber(prestigeGatheringPercent(chief)) })}
				</span>
			</div>
		</Card>
	);
}
