"use client";

import { useState } from "react";
import { initialBeastInputs, runBeastCalculator } from "@/service/calcBeast";
import { BeastResults } from "./beast/BeastResults";
import { PlannedHuntsCard } from "./beast/PlannedHuntsCard";
import { StaminaCard } from "./beast/StaminaCard";

export function BeastCalculator() {
	const [inputs, setInputs] = useState(initialBeastInputs);
	const result = runBeastCalculator(inputs);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 lg:grid-cols-2 lg:items-start">
				<StaminaCard inputs={inputs} onChange={setInputs} />
				<PlannedHuntsCard inputs={inputs} onChange={setInputs} />
			</div>
			<BeastResults inputs={inputs} result={result} />
		</div>
	);
}
