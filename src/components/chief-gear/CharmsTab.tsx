"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuClipboardList } from "react-icons/lu";
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
import { LockNotice } from "./LockNotice";

export function CharmsTab({ chief }: { chief: Playthrough }) {
	const t = useTranslations("chiefGear");
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
					<LuClipboardList size={16} aria-hidden="true" className="max-[359px]:hidden" />
					{t("shared.plan")}
				</Button>
				<p className="text-muted">{t("shared.autoSaveHint")}</p>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile value={formatNumber(summary.scoreNow)} label={t("charms.scoreNow")} />
				<StatTile value={formatNumber(summary.powerNow)} label={t("charms.powerNow")} />
				<StatTile value={formatNumber(summary.steps)} label={t("charms.stagesToGoals")} />
				<StatTile
					value={formatNumber(summary.scoreToGain)}
					label={t("shared.scoreToGain")}
					emphasis
				/>
			</div>
			<p className="text-muted">{t("charms.goalsHint")}</p>
			<LockNotice chief={chief} kind="charm" />

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
								<h2 className="font-semibold">{slot.name}</h2>
								<span className="text-muted font-mono text-xs">
									{t("charms.slotMeta", { troop: slot.troopType })}
									{stagesToGoals > 0
										? t("charms.slotStages", {
												stages: formatNumber(stagesToGoals),
											})
										: ""}
								</span>
							</div>
							<ul>
								{group.map((item) => {
									const row = rowOf("charm", item.current);
									const level = row?.level ?? 1;
									return (
										<LadderRow
											chief={chief}
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
					stepWord={t("charms.stepWord")}
					onOpenPlan={() => setPlanOpen(true)}
				/>
				<Card className="flex flex-col gap-3 p-4">
					<h2 className="font-semibold">{t("shared.notes")}</h2>
					<div>
						<p className="font-semibold">{t("charms.notes.secrets.title")}</p>
						<p className="text-muted">{t("charms.notes.secrets.body")}</p>
					</div>
					<div>
						<p className="font-semibold">{t("charms.notes.look.title")}</p>
						<p className="text-muted">{t("charms.notes.look.body")}</p>
					</div>
					<div>
						<p className="font-semibold">{t("charms.notes.estimate.title")}</p>
						<p className="text-muted">{t("charms.notes.estimate.body")}</p>
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
