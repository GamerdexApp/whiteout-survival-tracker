"use client";

import { BonusesView } from "@/comps/bonuses/BonusesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function BonusesPage() {
	return <ChiefGate title="Bonuses">{(chief) => <BonusesView chief={chief} />}</ChiefGate>;
}
