"use client";

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

const TIER_LABELS: Record<string, string> = {
	EpicT1: "Epic T1",
	MythicT1: "Mythic T1",
	MythicT2: "Mythic T2",
	LegendaryT1: "Legendary T1",
	LegendaryT2: "Legendary T2",
	LegendaryT3: "Legendary T3",
	LegendaryT4: "Legendary T4",
	LegendaryT5: "Legendary T5",
	LegendaryT6: "Legendary T6",
};

export function GearTab({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const [planOpen, setPlanOpen] = useState(false);
	const items = useMemo(() => gearItems(chief), [chief]);
	const summary = useMemo(() => summarizeLadder(items), [items]);
	const heldTiers = new Set(items.map((item) => rowOf("gear", item.current)?.tier));

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
					Plan
				</Button>
				<p className="text-muted">
					Every change saves at once. Steppers move one row at a time in package order.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={formatNumber(summary.scoreNow)}
					label="Gear score now, six slots"
				/>
				<StatTile value={formatNumber(summary.powerNow)} label="Gear power now" />
				<StatTile value={formatNumber(summary.steps)} label="Steps to all goals" />
				<StatTile
					value={formatNumber(summary.scoreToGain)}
					label="Score still to gain"
					emphasis
				/>
			</div>
			<p className="text-muted">
				Goals are read only here. Set them in Plan and press Save plan.
			</p>
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
					stepWord="steps"
					onOpenPlan={() => setPlanOpen(true)}
				/>
				<Card className="flex flex-col gap-3 p-4">
					<div className="flex items-baseline justify-between gap-3">
						<h3 className="font-semibold">Tiers</h3>
						<span className="text-muted font-mono text-xs">Package</span>
					</div>
					<p className="text-muted">
						The package labels 150 rows with {gearTiers.length} tiers. A highlighted
						tier holds at least one of your pieces.
					</p>
					<ul className="grid grid-cols-2 gap-2">
						{gearTiers.map(({ tier, rows }) => (
							<li
								key={tier}
								className={`flex items-baseline justify-between gap-2 rounded-md border-[1.5px] px-2 py-1.5 ${heldTiers.has(tier) ? "border-primary bg-tint" : "border-line"}`}
							>
								<span>{TIER_LABELS[tier] ?? tier}</span>
								<span className="text-muted font-mono text-xs">{rows} rows</span>
							</li>
						))}
					</ul>
				</Card>
				<Card className="flex flex-col gap-3 p-4">
					<h3 className="font-semibold">Notes</h3>
					<div>
						<p className="font-semibold">Set bonus rules</p>
						<p className="text-muted">
							3 pieces of the same tier give Defense and 6 pieces give Attack, for all
							three troop types. A piece with no level does not count. Each tier has
							one value.
						</p>
					</div>
					<div>
						<p className="font-semibold">Troop type is hand entered</p>
						<p className="text-muted">
							Cap and Watch buff Lancer, Coat and Pants buff Infantry, Ring and Weapon
							buff Marksman. The package author typed this from wiki text.
						</p>
					</div>
					<div>
						<p className="font-semibold">Capacity can be Unknown</p>
						<p className="text-muted">
							The first 26 rows have no deployment capacity in the package.
						</p>
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
