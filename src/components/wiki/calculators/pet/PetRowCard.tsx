"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { LuX } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import type { PetCalculatorRow } from "@/service/calcPet";
import { isAdvanceLevel, isGoalAdvancedLocked, levelOptions, petOfRow } from "@/service/calcPet";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { petRarityTone } from "../../pets/petRarityTone";
import { useGameLabels } from "../../useGameLabels";
import { CheckboxField } from "./CheckboxField";

interface PetRowCardProps {
	row: PetCalculatorRow;
	onChange: (change: Partial<Omit<PetCalculatorRow, "petId">>) => void;
	onRemove: () => void;
}

export function PetRowCard({ row, onChange, onRemove }: PetRowCardProps) {
	const t = useTranslations("calcPet.row");
	const labels = useGameLabels();
	const pet = petOfRow(row);
	const goalLocked = isGoalAdvancedLocked(row);
	const headingId = useId();

	return (
		<Card role="group" aria-labelledby={headingId} className="flex flex-col gap-3 p-4">
			<div className="flex items-start gap-3">
				<ItemIcon src={pet.img} size={40} />
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 id={headingId} className="font-semibold">
							{pet.name}
						</h3>
						<Badge tone={petRarityTone[pet.rarity]}>{labels.rarity(pet.rarity)}</Badge>
					</div>
					<span className="text-muted font-mono text-xs">
						{t("maxLevel", { max: formatNumber(pet.maxLevel) })}
					</span>
				</div>
				<IconButton
					label={t("remove", { pet: pet.name })}
					onClick={onRemove}
					className="text-muted hover:bg-tint hover:text-ink"
				>
					<LuX size={18} aria-hidden="true" />
				</IconButton>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex min-w-0 flex-col">
					<Field label={t("current")}>
						<Select
							value={row.current}
							onChange={(event) => onChange({ current: Number(event.target.value) })}
						>
							{levelOptions(1, pet.maxLevel).map((level) => (
								<option key={level} value={level}>
									{formatNumber(level)}
								</option>
							))}
						</Select>
					</Field>
					<CheckboxField
						label={t("currentAdvanced")}
						checked={row.currentAdvanced}
						disabled={!isAdvanceLevel(row.current)}
						onChange={(currentAdvanced) => onChange({ currentAdvanced })}
					/>
				</div>
				<div className="flex min-w-0 flex-col">
					<Field label={t("goal")}>
						<Select
							value={row.goal}
							onChange={(event) => onChange({ goal: Number(event.target.value) })}
						>
							{levelOptions(row.current, pet.maxLevel).map((level) => (
								<option key={level} value={level}>
									{formatNumber(level)}
								</option>
							))}
						</Select>
					</Field>
					<CheckboxField
						label={t("goalAdvanced")}
						checked={row.goalAdvanced}
						disabled={goalLocked || !isAdvanceLevel(row.goal)}
						onChange={(goalAdvanced) => onChange({ goalAdvanced })}
					/>
				</div>
			</div>
			{goalLocked && <p className="text-muted text-xs">{t("keepsAdvancement")}</p>}
		</Card>
	);
}
