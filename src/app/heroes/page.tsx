"use client";

import { HeroesView } from "@/comps/heroes/HeroesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function HeroesPage() {
	return <ChiefGate title="Heroes">{(chief) => <HeroesView chief={chief} />}</ChiefGate>;
}
