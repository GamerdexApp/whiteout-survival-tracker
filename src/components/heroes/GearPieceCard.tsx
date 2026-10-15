"use client";

import { useTranslations } from "next-intl";
import type { HeroGearPiece, HeroGearQuality, HeroGearSet, HeroGearSlot } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import {
	empowermentLock,
	enhancementFloor,
	forgingFloorIndex,
	forgingLimitIndex,
	isMythic,
	lockText,
	milestonesReached,
	pieceStats,
	qualityOf,
	slotName,
} from "@/service/heroGear";
import {
	forgingIndex,
	forgingRows,
	gearQualityIds,
	gearSlots,
	MAX_EMPOWERMENT,
	MAX_ENHANCEMENT,
} from "@/data/game/heroGear";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { GoalText, HeroRow } from "./HeroRows";

interface GearPieceCardProps {
	set: HeroGearSet;
	slot: HeroGearSlot;
	goal: HeroGearPiece;
	onChange: (patch: Partial<HeroGearPiece>) => void;
	onQualityChange: (quality: HeroGearQuality) => void;
}

export function GearPieceCard({ set, slot, goal, onChange, onQualityChange }: GearPieceCardProps) {
	const t = useTranslations("heroGear.pieceCard");
	const piece = set.pieces[slot];
	const info = gearSlots.find((item) => item.id === slot);
	const mythic = isMythic(piece);
	const stats = pieceStats(set.troopType, slot, piece);
	const lock = empowermentLock(piece);
	const limit = forgingLimitIndex(piece.enhancement);
	const floor = forgingFloorIndex(piece);
	const name = t("name", { set: set.name, slot: slotName(slot) });
	const forgingLabel = (id: string | null) => {
		const row = forgingRows.find((item) => item.id === id);
		return row
			? t("forgingRow", { name: row.name, percent: formatDecimal(row.statsUpPercent) })
			: t("none");
	};
	const hasForgingGoal = forgingIndex(goal.forging) > forgingIndex(piece.forging);
	const milestones = milestonesReached(set.troopType, slot, piece);

	return (
		<li>
			<Card className="flex flex-col gap-2 p-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={info?.images[set.troopType]} size={36} />
					<h3 className="font-semibold">{info?.name}</h3>
					{stats && (
						<span className="text-muted font-mono text-xs">
							{stats.combatStatName} · {stats.percentStatName}
						</span>
					)}
				</div>

				<div className="flex items-center justify-between gap-3">
					<label htmlFor={`${set.id}-${slot}-quality`}>{t("quality")}</label>
					<div className="w-40">
						<Select
							id={`${set.id}-${slot}-quality`}
							value={qualityOf(piece)}
							onChange={(event) =>
								onQualityChange(event.target.value as HeroGearQuality)
							}
						>
							{gearQualityIds.map((id) => (
								<option key={id} value={id}>
									{t(`qualities.${id}`)}
								</option>
							))}
						</Select>
					</div>
				</div>
				{mythic && (
					<div className="flex flex-col gap-1">
						<div className="flex items-baseline justify-between gap-3">
							<label htmlFor={`${set.id}-${slot}-forging`}>
								{t("forgingRowLabel")}
							</label>
							{!hasForgingGoal && (
								<span className="text-muted font-mono text-xs">{t("noGoal")}</span>
							)}
						</div>
						{hasForgingGoal && (
							<span className="text-primary font-mono text-xs">
								{t("goal", { value: forgingLabel(goal.forging) })}
							</span>
						)}
						<Select
							id={`${set.id}-${slot}-forging`}
							value={piece.forging ?? ""}
							onChange={(event) => onChange({ forging: event.target.value || null })}
						>
							<option value="" disabled={floor >= 0}>
								{t("none")}
							</option>
							{forgingRows.map((row, index) => (
								<option
									key={row.id}
									value={row.id}
									disabled={index > limit || index < floor}
								>
									{forgingLabel(row.id)}
								</option>
							))}
						</Select>
						{piece.enhancement < MAX_ENHANCEMENT && (
							<p className="text-muted text-xs">{t("forgingStops")}</p>
						)}
					</div>
				)}
				{!mythic && <p className="text-muted text-xs">{t("lowQualityNote")}</p>}

				<div className="flex flex-col">
					<HeroRow label={t("enhancement")}>
						<GoalText
							goal={
								goal.enhancement > piece.enhancement
									? String(goal.enhancement)
									: null
							}
							empty={t("noGoal")}
						/>
						<ValueStepper
							label={t("enhancementLabel", { name })}
							value={piece.enhancement}
							min={enhancementFloor(piece)}
							max={MAX_ENHANCEMENT}
							suffix={t("outOf", { max: formatNumber(MAX_ENHANCEMENT) })}
							onChange={(enhancement) => onChange({ enhancement })}
						/>
					</HeroRow>
					{enhancementFloor(piece) < MAX_ENHANCEMENT && (
						<input
							type="range"
							aria-label={t("enhancementSlider", { name })}
							min={enhancementFloor(piece)}
							max={MAX_ENHANCEMENT}
							value={piece.enhancement}
							onChange={(event) =>
								onChange({ enhancement: Number(event.target.value) })
							}
							className="accent-primary w-full"
						/>
					)}
				</div>

				{lock ? (
					<div className="border-line flex flex-wrap items-center justify-between gap-2 rounded-md border-[1.5px] border-dashed p-2">
						<span>{t("empowerment")}</span>
						<span className="text-muted font-mono text-xs">{lockText(lock)}</span>
					</div>
				) : (
					<div className="flex flex-col">
						<HeroRow label={t("empowerment")}>
							<GoalText
								goal={
									goal.empowerment > piece.empowerment
										? String(goal.empowerment)
										: null
								}
								empty={t("noGoal")}
							/>
							<ValueStepper
								label={t("empowermentLabel", { name })}
								value={piece.empowerment}
								min={0}
								max={MAX_EMPOWERMENT}
								suffix={t("outOf", { max: formatNumber(MAX_EMPOWERMENT) })}
								onChange={(empowerment) => onChange({ empowerment })}
							/>
						</HeroRow>
						<input
							type="range"
							aria-label={t("empowermentSlider", { name })}
							min={0}
							max={MAX_EMPOWERMENT}
							value={piece.empowerment}
							onChange={(event) =>
								onChange({ empowerment: Number(event.target.value) })
							}
							className="accent-primary w-full"
						/>
					</div>
				)}

				{milestones.map((milestone) => (
					<p key={milestone.empowermentLevel} className="text-kept text-xs">
						{t("milestone", {
							level: formatNumber(milestone.empowermentLevel),
							stat: milestone.stat,
						})}
					</p>
				))}

				<div className="flex flex-col">
					<HeroRow label={t("piecePower")}>
						<span
							className={
								stats && stats.power > 0
									? "font-mono font-medium"
									: "text-muted font-mono"
							}
						>
							{stats && stats.power > 0 ? formatNumber(stats.power) : t("none")}
						</span>
					</HeroRow>
					{stats && piece.enhancement > 0 && (
						<>
							<HeroRow label={stats.combatStatName}>
								<span className="font-mono">{formatNumber(stats.combatStat)}</span>
							</HeroRow>
							<HeroRow label={t("health")}>
								<span className="font-mono">{formatNumber(stats.health)}</span>
							</HeroRow>
							<HeroRow label={stats.percentStatName}>
								<span className="font-mono">
									{t("percent", { value: formatDecimal(stats.percentStat) })}
								</span>
							</HeroRow>
						</>
					)}
				</div>
			</Card>
		</li>
	);
}
