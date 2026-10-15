"use client";

import { ChiefGate } from "@/comps/layout/ChiefGate";
import { ResearchView } from "@/comps/research/ResearchView";

export default function ResearchPage() {
	return <ChiefGate title="Research">{(chief) => <ResearchView chief={chief} />}</ChiefGate>;
}
