"use client";

import { ChiefGearView } from "@/comps/chief-gear/ChiefGearView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function ChiefGearPage() {
	return <ChiefGate title="Chief Gear">{(chief) => <ChiefGearView chief={chief} />}</ChiefGate>;
}
