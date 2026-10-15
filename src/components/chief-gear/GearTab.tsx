"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import type { PlanGoalMap } from "@/service/chiefGear";
import {
	gearItems,
	rowOf,
	setBonusesOf,
	summarizeLadder,
	withItemLevel,
	withSavedGoals,
} from "@/service/chiefGear";
import { updateChiefById } from "@/service/chiefs";
import { chiefGearSlotList, gearTiers } from "@/data/game/chiefGear";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { StatTile } from "@/comps/ui/StatTile";
import { GearTierBadge } from "./GearTierBadge";
import { LadderPlanFlyout } from "./LadderPlanFlyout";
import { LadderRow } from "./LadderRow";
import { LadderSummaryCard } from "./LadderSummary";
import { SetBonusCard } from "./SetBonusCard";

export function GearTab({ chief }: { chief: Playthrough }) {
	const t = useTranslations("chiefGear");
	const { updateData } = usePlaythrough();
	const [planOpen, setPlanOpen] = useState(false);
	const items = useMemo(() => gearItems(chief), [chief]);
	const summary = useMemo(() => summarizeLadder(items), [items]);
	const heldTiers = new Set(items.map((item) => rowOf("gear", item.current)?.tier));

	const tierName = (tier: string) =>
		t.has(`gear.tiers.names.${tier}` as "gear.tiers.names.EpicT1")
			? t(`gear.tiers.names.${tier}` as "gear.tiers.names.EpicT1")
			: tier;

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const savePlan = (goals: PlanGoalMap) => {
		change((current) => withSavedGoals(current, "gear", goals, new Date().toISOString()));
	};

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					variant="primary"
					className="max-lg:w-full"
					onClick={() => setPlanOpen(true)}
				>
					{t("shared.plan")}
				</Button>
				<p className="text-muted">{t("shared.autoSaveHint")}</p>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile value={formatNumber(summary.scoreNow)} label={t("gear.scoreNow")} />
				<StatTile value={formatNumber(summary.powerNow)} label={t("gear.powerNow")} />
				<StatTile value={formatNumber(summary.steps)} label={t("gear.stepsToGoals")} />
				<StatTile
					value={formatNumber(summary.scoreToGain)}
					label={t("shared.scoreToGain")}
					emphasis
				/>
			</div>
			<p className="text-muted">{t("gear.goalsHint")}</p>
			<SetBonusCard bonuses={setBonusesOf(chief)} />

			<Card>
				<ul>
					{items.map((item) => {
						const slot = chiefGearSlotList.find((entry) => entry.id === item.slotId);
						const row = rowOf("gear", item.current);
						return (
							<LadderRow
								key={item.key}
								item={item}
								title={item.label}
								troopLabel={item.troopType}
								iconBadge={<GearTierBadge tier={row?.tier} stars={row?.stars} />}
								iconSrc={
									slot
										? slot.images[
												(row
													? chiefGearBaseRarity(row.tier ?? "Common")
													: "Common") as keyof typeof slot.images
											]
										: undefined
								}
								onChange={(current) =>
									change((value) => withItemLevel(value, item, current))
								}
							/>
						);
					})}
				</ul>
			</Card>

			<div className="grid items-start gap-3 lg:grid-cols-3">
				<LadderSummaryCard
					summary={summary}
					stepWord={t("gear.stepWord")}
					onOpenPlan={() => setPlanOpen(true)}
				/>
				<Card className="flex flex-col gap-3 p-4">
					<div className="flex items-baseline justify-between gap-3">
						<h3 className="font-semibold">{t("gear.tiers.title")}</h3>
						<span className="text-muted font-mono text-xs">{t("shared.package")}</span>
					</div>
					<p className="text-muted">
						{t("gear.tiers.description", { count: formatNumber(gearTiers.length) })}
					</p>
					<ul className="grid grid-cols-2 gap-2">
						{gearTiers.map(({ tier, rows }) => (
							<li
								key={tier}
								className={`flex items-baseline justify-between gap-2 rounded-md border-[1.5px] px-2 py-1.5 ${heldTiers.has(tier) ? "border-primary bg-tint" : "border-line"}`}
							>
								<span>{tierName(tier)}</span>
								<span className="text-muted font-mono text-xs">
									{t("gear.tiers.rows", { rows: formatNumber(rows) })}
								</span>
							</li>
						))}
					</ul>
				</Card>
				<Card className="flex flex-col gap-3 p-4">
					<h3 className="font-semibold">{t("shared.notes")}</h3>
					<div>
						<p className="font-semibold">{t("gear.notes.setBonus.title")}</p>
						<p className="text-muted">{t("gear.notes.setBonus.body")}</p>
					</div>
					<div>
						<p className="font-semibold">{t("gear.notes.troopType.title")}</p>
						<p className="text-muted">{t("gear.notes.troopType.body")}</p>
					</div>
					<div>
						<p className="font-semibold">{t("gear.notes.capacity.title")}</p>
						<p className="text-muted">{t("gear.notes.capacity.body")}</p>
					</div>
				</Card>
			</div>

			<LadderPlanFlyout
				open={planOpen}
				chief={chief}
				kind="gear"
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}

const chiefGearBaseRarity = (tier: string) => tier.replace(/T\d+$/, "");
