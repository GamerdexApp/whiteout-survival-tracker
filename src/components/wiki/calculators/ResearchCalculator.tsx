"use client";

import { useMemo, useState } from "react";
import { initialResearchInputs, runResearchCalculator } from "@/service/calcResearch";
import { LinesCard } from "./research/LinesCard";
import { ResearchResults } from "./research/ResearchResults";
import { SpeedCard } from "./research/SpeedCard";

export function ResearchCalculator() {
	const [inputs, setInputs] = useState(initialResearchInputs);
	const calculation = useMemo(() => runResearchCalculator(inputs), [inputs]);

	return (
		<div className="flex flex-col gap-6">
			<SpeedCard
				inputs={inputs}
				totalSpeedPercent={calculation.researchSpeedPercent}
				onChange={setInputs}
				onReset={() => setInputs(initialResearchInputs)}
			/>
			<ResearchResults inputs={inputs} calculation={calculation} />
			<LinesCard inputs={inputs} onChange={setInputs} />
		</div>
	);
}
