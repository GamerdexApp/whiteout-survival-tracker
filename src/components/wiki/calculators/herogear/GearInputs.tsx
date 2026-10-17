"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { HeroGearInputs, LevelRange, RangeSide } from "@/service/calcHeroGear";
import { isMythic, NO_FORGING, withQuality, withRangeSide } from "@/service/calcHeroGear";
import {
	forgingRows,
	gearQualityIds,
	gearSlots,
	MAX_EMPOWERMENT,
	MAX_ENHANCEMENT,
	troopTypes,
} from "@/data/game/calcHeroGear";
import type { HeroGearQuality, HeroGearSlot, TroopType } from "@/data/game/calcHeroGear";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { Select } from "@/comps/ui/Select";
import { type RarityId, useGameLabels } from "../../useGameLabels";

interface LevelOption {
	value: number;
	label: string;
}

const RARITY_OF_QUALITY: Record<HeroGearQuality, RarityId> = {
	common: "Common",
	uncommon: "Uncommon",
	rare: "Rare",
	epic: "Epic",
	mythic: "Mythic",
};

const levelOptions = (max: number): LevelOption[] =>
	Array.from({ length: max + 1 }, (_, level) => ({ value: level, label: formatNumber(level) }));

export function PieceInputs({
	inputs,
	onChange,
}: {
	inputs: HeroGearInputs;
	onChange: (inputs: HeroGearInputs) => void;
}) {
	const t = useTranslations("calcHeroGear.piece");
	const labels = useGameLabels();
	const slot = gearSlots.find((entry) => entry.id === inputs.slot)!;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-3">
				<ItemIcon src={slot.images[inputs.troopType]} size={48} />
				<div className="flex flex-col">
					<h2 className="font-semibold">
						{t("name", { troop: labels.troopId(inputs.troopType), slot: slot.name })}
					</h2>
					<span className="text-muted">
						{labels.rarity(RARITY_OF_QUALITY[inputs.quality])}
					</span>
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				<Field label={t("quality")}>
					<Select
						value={inputs.quality}
						onChange={(event) =>
							onChange(withQuality(inputs, event.target.value as HeroGearQuality))
						}
					>
						{gearQualityIds.map((id) => (
							<option key={id} value={id}>
								{labels.rarity(RARITY_OF_QUALITY[id])}
							</option>
						))}
					</Select>
				</Field>
				<Field label={t("slot")}>
					<Select
						value={inputs.slot}
						onChange={(event) =>
							onChange({ ...inputs, slot: event.target.value as HeroGearSlot })
						}
					>
						{gearSlots.map((entry) => (
							<option key={entry.id} value={entry.id}>
								{entry.name}
							</option>
						))}
					</Select>
				</Field>
				<Field label={t("troopType")}>
					<Select
						value={inputs.troopType}
						onChange={(event) =>
							onChange({ ...inputs, troopType: event.target.value as TroopType })
						}
					>
						{troopTypes.map((id) => (
							<option key={id} value={id}>
								{labels.troopId(id)}
							</option>
						))}
					</Select>
				</Field>
			</div>
			{!isMythic(inputs.quality) && <Note>{t("mythicOnly")}</Note>}
		</Card>
	);
}

export function TrackInputs({
	inputs,
	onChange,
}: {
	inputs: HeroGearInputs;
	onChange: (inputs: HeroGearInputs) => void;
}) {
	const t = useTranslations("calcHeroGear.tracks");
	const mythic = isMythic(inputs.quality);
	const forgingOptions: LevelOption[] = [
		{ value: NO_FORGING, label: t("none") },
		...forgingRows.map((row, index) => ({
			value: index,
			label: t("forgingRow", { name: row.name, percent: formatDecimal(row.statsUpPercent) }),
		})),
	];
	const change =
		(track: "forging" | "enhancement" | "empowerment") => (side: RangeSide, value: number) =>
			onChange({ ...inputs, [track]: withRangeSide(inputs[track], side, value) });

	return (
		<div className="grid gap-3 md:grid-cols-3">
			<TrackCard
				title={t("enhancement")}
				hint={t("range", { from: formatNumber(0), to: formatNumber(MAX_ENHANCEMENT) })}
				range={inputs.enhancement}
				options={levelOptions(MAX_ENHANCEMENT)}
				onChange={change("enhancement")}
			/>
			<TrackCard
				title={t("masteryForging")}
				hint={mythic ? undefined : t("needsMythic")}
				range={inputs.forging}
				options={forgingOptions}
				disabled={!mythic}
				onChange={change("forging")}
			/>
			<TrackCard
				title={t("empowerment")}
				hint={
					mythic
						? t("range", { from: formatNumber(0), to: formatNumber(MAX_EMPOWERMENT) })
						: t("needsMythic")
				}
				range={inputs.empowerment}
				options={levelOptions(MAX_EMPOWERMENT)}
				disabled={!mythic}
				onChange={change("empowerment")}
			/>
		</div>
	);
}

function TrackCard({
	title,
	hint,
	range,
	options,
	disabled = false,
	onChange,
}: {
	title: string;
	hint?: string;
	range: LevelRange;
	options: LevelOption[];
	disabled?: boolean;
	onChange: (side: RangeSide, value: number) => void;
}) {
	const t = useTranslations("calcHeroGear.tracks");
	const sides: RangeSide[] = ["current", "goal"];

	return (
		<Card dimmed={disabled} className="p-4">
			<fieldset disabled={disabled} className="flex min-w-0 flex-col gap-3">
				<legend className="flex w-full flex-col gap-0.5 pb-3">
					<span className="font-semibold">{title}</span>
					{hint && <span className="text-muted text-xs">{hint}</span>}
				</legend>
				<div className="grid grid-cols-2 gap-3">
					{sides.map((side) => (
						<Field key={side} label={t(side)}>
							<Select
								value={range[side]}
								onChange={(event) => onChange(side, Number(event.target.value))}
							>
								{options.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</Field>
					))}
				</div>
			</fieldset>
		</Card>
	);
}
