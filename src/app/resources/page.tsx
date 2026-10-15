"use client";

import { ChiefGate } from "@/comps/layout/ChiefGate";
import { ResourcesView } from "@/comps/resources/ResourcesView";

export default function ResourcesPage() {
	return <ChiefGate title="Resources">{(chief) => <ResourcesView chief={chief} />}</ChiefGate>;
}
