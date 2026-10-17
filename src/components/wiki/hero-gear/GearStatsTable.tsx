"use client";

import type { HeroGearSlot, HeroGearStatLevel, TroopType } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import { gearSlots, statEntry, troopTypes } from "@/data/game/heroGear";
import { STATS_EMPOWERMENT_OFFSET } from "@/data/game/wikiHeroGear";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";

export function GearStatsTable() {
	const t = useTranslations("wikiHeroGear.stats");
	const [slot, setSlot] = useState<HeroGearSlot>(gearSlots[0].id);
	const [troopType, setTroopType] = useState<TroopType>(troopTypes[0]);
	const entry = statEntry(slot, troopType);

	if (!entry) return null;

	const columns: RecordColumn<HeroGearStatLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (row) => (
				<span className="font-semibold">
					{row.level > STATS_EMPOWERMENT_OFFSET
						? t("empowermentLevel", {
								level: formatNumber(row.level),
								empowerment: formatNumber(row.level - STATS_EMPOWERMENT_OFFSET),
							})
						: t("level", { level: formatNumber(row.level) })}
				</span>
			),
		},
		{
			id: "combat",
			header: t("columns.combat", { stat: entry.combatStat }),
			cell: (row) => <span className="font-mono">{formatNumber(row.combatStat)}</span>,
		},
		{
			id: "health",
			header: t("columns.health"),
			cell: (row) => <span className="font-mono">{formatNumber(row.health)}</span>,
		},
		{
			id: "percent",
			header: t("columns.percent", { stat: entry.percentStat }),
			cell: (row) => (
				<span className="font-mono">
					{t("percentValue", { value: formatDecimal(row.percentStat) })}
				</span>
			),
		},
	];

	return (
		<>
			<div className="flex flex-wrap gap-4">
				<SegmentedControl
					label={t("slot")}
					options={gearSlots.map((gearSlot) => ({
						id: gearSlot.id,
						label: gearSlot.name,
					}))}
					value={slot}
					onChange={setSlot}
				/>
				<SegmentedControl
					label={t("troopType")}
					options={troopTypes.map((id) => ({ id, label: t(`troop.${id}`) }))}
					value={troopType}
					onChange={setTroopType}
				/>
			</div>
			<Note>{t("note")}</Note>
			<RecordTable
				columns={columns}
				rows={entry.levels}
				rowKey={(row) => String(row.level)}
			/>
			<RecordSection title={t("milestonesTitle")} meta={entry.name}>
				<Card className="p-4">
					<ul className="flex flex-col gap-2">
						{entry.milestones.map((milestone) => (
							<li key={milestone.empowermentLevel}>
								{t("milestone", {
									level: formatNumber(milestone.empowermentLevel),
									event: milestone.event,
									stat: milestone.stat,
								})}
							</li>
						))}
					</ul>
				</Card>
			</RecordSection>
		</>
	);
}
