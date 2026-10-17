"use client";

import { useMemo, useState } from "react";
import { initialBuildingInputs, runBuildingCalculator } from "@/service/calcBuilding";
import { BuildingResults } from "./building/BuildingResults";
import { BuildingsCard } from "./building/BuildingsCard";
import { SpeedCard } from "./building/SpeedCard";

export function BuildingCalculator() {
	const [inputs, setInputs] = useState(initialBuildingInputs);
	const calculation = useMemo(() => runBuildingCalculator(inputs), [inputs]);

	return (
		<div className="flex flex-col gap-6">
			<SpeedCard
				inputs={inputs}
				onChange={setInputs}
				onReset={() => setInputs(initialBuildingInputs)}
			/>
			<BuildingResults inputs={inputs} calculation={calculation} />
			<BuildingsCard inputs={inputs} onChange={setInputs} />
		</div>
	);
}
