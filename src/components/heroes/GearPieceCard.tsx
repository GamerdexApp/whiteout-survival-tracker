"use client";

import type { HeroGearPiece, HeroGearQuality, HeroGearSet, HeroGearSlot } from "@/types/app";
import { formatNumber } from "@/lib/format";
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
} from "@/service/heroGear";
import {
	forgingIndex,
	forgingRows,
	gearQualities,
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

const forgingLabel = (id: string | null) => {
	const row = forgingRows.find((item) => item.id === id);
	return row ? `${row.name} (+${row.statsUpPercent}%)` : "None";
};

export function GearPieceCard({ set, slot, goal, onChange, onQualityChange }: GearPieceCardProps) {
	const piece = set.pieces[slot];
	const info = gearSlots.find((item) => item.id === slot);
	const mythic = isMythic(piece);
	const stats = pieceStats(set.troopType, slot, piece);
	const lock = empowermentLock(piece);
	const limit = forgingLimitIndex(piece.enhancement);
	const floor = forgingFloorIndex(piece);
	const name = `${set.name} ${info?.name}`;
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
					<label htmlFor={`${set.id}-${slot}-quality`}>Gear quality</label>
					<div className="w-40">
						<Select
							id={`${set.id}-${slot}-quality`}
							value={qualityOf(piece)}
							onChange={(event) =>
								onQualityChange(event.target.value as HeroGearQuality)
							}
						>
							{gearQualities.map((item) => (
								<option key={item.id} value={item.id}>
									{item.label}
								</option>
							))}
						</Select>
					</div>
				</div>
				{mythic && (
					<div className="flex flex-col gap-1">
						<div className="flex items-baseline justify-between gap-3">
							<label htmlFor={`${set.id}-${slot}-forging`}>Mastery forging row</label>
							{!hasForgingGoal && (
								<span className="text-muted font-mono text-xs">No goal</span>
							)}
						</div>
						{hasForgingGoal && (
							<span className="text-primary font-mono text-xs">
								Goal: {forgingLabel(goal.forging)}
							</span>
						)}
						<Select
							id={`${set.id}-${slot}-forging`}
							value={piece.forging ?? ""}
							onChange={(event) => onChange({ forging: event.target.value || null })}
						>
							<option value="" disabled={floor >= 0}>
								None
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
							<p className="text-muted text-xs">
								Mastery forging stops at level 10 until enhancement is 100.
							</p>
						)}
					</div>
				)}
				{!mythic && (
					<p className="text-muted text-xs">
						Only Mythic gear can be forged and empowered. Power follows the Mythic
						tables with the base power of this quality, which the game has not
						confirmed.
					</p>
				)}

				<div className="flex flex-col">
					<HeroRow label="Enhancement">
						<GoalText
							goal={
								goal.enhancement > piece.enhancement
									? String(goal.enhancement)
									: null
							}
							empty="No goal"
						/>
						<ValueStepper
							label={`${name} enhancement`}
							value={piece.enhancement}
							min={enhancementFloor(piece)}
							max={MAX_ENHANCEMENT}
							suffix={`/ ${MAX_ENHANCEMENT}`}
							onChange={(enhancement) => onChange({ enhancement })}
						/>
					</HeroRow>
					{enhancementFloor(piece) < MAX_ENHANCEMENT && (
						<input
							type="range"
							aria-label={`${name} enhancement slider`}
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
						<span>Empowerment</span>
						<span className="text-muted font-mono text-xs">{lockText(lock)}</span>
					</div>
				) : (
					<div className="flex flex-col">
						<HeroRow label="Empowerment">
							<GoalText
								goal={
									goal.empowerment > piece.empowerment
										? String(goal.empowerment)
										: null
								}
								empty="No goal"
							/>
							<ValueStepper
								label={`${name} empowerment`}
								value={piece.empowerment}
								min={0}
								max={MAX_EMPOWERMENT}
								suffix={`/ ${MAX_EMPOWERMENT}`}
								onChange={(empowerment) => onChange({ empowerment })}
							/>
						</HeroRow>
						<input
							type="range"
							aria-label={`${name} empowerment slider`}
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
						Empowerment {milestone.empowermentLevel} reached: {milestone.stat}
					</p>
				))}

				<div className="flex flex-col">
					<HeroRow label="Piece power">
						<span
							className={
								stats && stats.power > 0
									? "font-mono font-medium"
									: "text-muted font-mono"
							}
						>
							{stats && stats.power > 0 ? formatNumber(stats.power) : "None"}
						</span>
					</HeroRow>
					{stats && piece.enhancement > 0 && (
						<>
							<HeroRow label={stats.combatStatName}>
								<span className="font-mono">{formatNumber(stats.combatStat)}</span>
							</HeroRow>
							<HeroRow label="Health">
								<span className="font-mono">{formatNumber(stats.health)}</span>
							</HeroRow>
							<HeroRow label={stats.percentStatName}>
								<span className="font-mono">{stats.percentStat}%</span>
							</HeroRow>
						</>
					)}
				</div>
			</Card>
		</li>
	);
}
