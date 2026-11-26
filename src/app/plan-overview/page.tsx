"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { PlanOverviewView } from "@/comps/plan-overview/PlanOverviewView";

export default function PlanOverviewPage() {
	const t = useTranslations("shell.nav.items");

	return (
		<ChiefGate title={t("planOverview")}>
			{(chief) => <PlanOverviewView chief={chief} />}
		</ChiefGate>
	);
}
