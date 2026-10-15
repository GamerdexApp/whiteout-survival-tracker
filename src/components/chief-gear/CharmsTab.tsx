"use client";

import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import type { PlanGoalMap } from "@/service/chiefGear";
import {
	charmItems,
	rowOf,
	stepsToGoal,
	summarizeLadder,
	withItemLevel,
	withSavedGoals,
} from "@/service/chiefGear";
import { updateChiefById } from "@/service/chiefs";
import { chiefCharmImage, chiefGearSlotList, findCharmSlotByTroop } from "@/data/game/chiefGear";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { StatTile } from "@/comps/ui/StatTile";
import { LadderPlanFlyout } from "./LadderPlanFlyout";
import { LadderRow } from "./LadderRow";
import { LadderSummaryCard } from "./LadderSummary";

export function CharmsTab({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const [planOpen, setPlanOpen] = useState(false);
	const items = useMemo(() => charmItems(chief), [chief]);
	const summary = useMemo(() => summarizeLadder(items), [items]);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const savePlan = (goals: PlanGoalMap) => {
		change((current) => withSavedGoals(current, "charm", goals, new Date().toISOString()));
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
					label="Charm score now, 18 charms"
				/>
				<StatTile value={formatNumber(summary.powerNow)} label="Charm power now" />
				<StatTile value={formatNumber(summary.steps)} label="Stages to all goals" />
				<StatTile
					value={formatNumber(summary.scoreToGain)}
					label="Score still to gain"
					emphasis
				/>
			</div>
			<p className="text-muted">Goals are read only here and are set in Plan.</p>

			<Card>
				{chiefGearSlotList.map((slot) => {
					const group = items.filter((item) => item.slotId === slot.id);
					const stagesToGoals = group.reduce(
						(total, item) => total + stepsToGoal(item),
						0
					);
					const charmSlot = findCharmSlotByTroop(slot.troopType);
					return (
						<section key={slot.id}>
							<div className="bg-tint flex items-center justify-between gap-3 px-4 py-2">
								<h3 className="font-semibold">{slot.name}</h3>
								<span className="text-muted font-mono text-xs">
									{slot.troopType} · 3 charms
									{stagesToGoals > 0 ? `, ${stagesToGoals} stages to goals` : ""}
								</span>
							</div>
							<ul>
								{group.map((item) => {
									const row = rowOf("charm", item.current);
									const level = row?.level ?? 1;
									return (
										<LadderRow
											key={item.key}
											item={item}
											title={item.label}
											iconSrc={
												charmSlot
													? chiefCharmImage(charmSlot, level)
													: undefined
											}
											onChange={(current) =>
												change((value) =>
													withItemLevel(value, item, current)
												)
											}
										/>
									);
								})}
							</ul>
						</section>
					);
				})}
			</Card>

			<div className="grid items-start gap-3 lg:grid-cols-2">
				<LadderSummaryCard
					summary={summary}
					stepWord="stages"
					onOpenPlan={() => setPlanOpen(true)}
				/>
				<Card className="flex flex-col gap-3 p-4">
					<h3 className="font-semibold">Notes</h3>
					<div>
						<p className="font-semibold">Charm Secrets starts at level 11</p>
						<p className="text-muted">
							From Level 11 Stage 1 a stage needs Charm Secrets. Earlier stages list
							only Charm Guide and Charm Design.
						</p>
					</div>
					<div>
						<p className="font-semibold">Charms change look at every level</p>
						<p className="text-muted">
							Each charm has 18 icons, one per level. Every gear piece carries three
							charms, and they follow the troop type of the piece.
						</p>
					</div>
					<div>
						<p className="font-semibold">Stage scores are an estimate</p>
						<p className="text-muted">
							A level score is shared evenly over the stages that lead to it. The game
							does not confirm the split.
						</p>
					</div>
				</Card>
			</div>

			<LadderPlanFlyout
				open={planOpen}
				chief={chief}
				kind="charm"
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}
