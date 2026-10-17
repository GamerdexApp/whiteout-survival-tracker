"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { PetCalculatorRow } from "@/service/calcPet";
import { newPetRow, petsNotInRows, withEveryGoalAtMax } from "@/service/calcPet";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";
import { CheckboxField } from "./CheckboxField";

interface PetPickerCardProps {
	rows: PetCalculatorRow[];
	onChange: (rows: PetCalculatorRow[]) => void;
}

export function PetPickerCard({ rows, onChange }: PetPickerCardProps) {
	const t = useTranslations("calcPet");
	const [selectedId, setSelectedId] = useState("");
	const [advanceAtMax, setAdvanceAtMax] = useState(false);
	const addable = petsNotInRows(rows);
	const selected = addable.find((pet) => pet.id === selectedId) ?? addable[0];
	const hasRows = rows.length > 0;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<p className="text-muted">{t("intro")}</p>
			{selected ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div className="min-w-0 sm:w-72">
						<Field label={t("picker.petLabel")}>
							<Select
								value={selected.id}
								onChange={(event) => setSelectedId(event.target.value)}
							>
								{addable.map((pet) => (
									<option key={pet.id} value={pet.id}>
										{pet.name}
									</option>
								))}
							</Select>
						</Field>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="primary"
							onClick={() => onChange([...rows, newPetRow(selected)])}
						>
							<LuPlus size={16} aria-hidden="true" />
							{t("picker.add")}
						</Button>
						<Button onClick={() => onChange([...rows, ...addable.map(newPetRow)])}>
							{t("picker.addAll")}
						</Button>
					</div>
				</div>
			) : (
				<p className="text-muted">{t("picker.allAdded")}</p>
			)}
			{hasRows && (
				<div className="border-line flex flex-col gap-2 border-t-[1.5px] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
					<Button onClick={() => onChange(withEveryGoalAtMax(rows, advanceAtMax))}>
						{t("picker.setAllMax")}
					</Button>
					<CheckboxField
						label={t("picker.advanceAtMax")}
						checked={advanceAtMax}
						onChange={setAdvanceAtMax}
					/>
					<Button variant="danger" className="sm:ms-auto" onClick={() => onChange([])}>
						{t("picker.removeAll")}
					</Button>
				</div>
			)}
		</Card>
	);
}
