"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PetCalculatorRow } from "@/service/calcPet";
import { runPetCalculator, withRowChanged } from "@/service/calcPet";
import { Note } from "@/comps/ui/Note";
import { PetPickerCard } from "./pet/PetPickerCard";
import { PetResults } from "./pet/PetResults";
import { PetRowCard } from "./pet/PetRowCard";

export function PetCalculator() {
	const t = useTranslations("calcPet");
	const [rows, setRows] = useState<PetCalculatorRow[]>([]);
	const result = runPetCalculator(rows);

	return (
		<div className="flex flex-col gap-6">
			<PetPickerCard rows={rows} onChange={setRows} />
			{rows.length === 0 ? (
				<Note>{t("empty")}</Note>
			) : (
				<div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
					{rows.map((row) => (
						<PetRowCard
							key={row.petId}
							row={row}
							onChange={(change) => setRows(withRowChanged(rows, row.petId, change))}
							onRemove={() =>
								setRows(rows.filter((other) => other.petId !== row.petId))
							}
						/>
					))}
				</div>
			)}
			<PetResults result={result} />
		</div>
	);
}
