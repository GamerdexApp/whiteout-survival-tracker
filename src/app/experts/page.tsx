"use client";

import { useTranslations } from "next-intl";
import { ExpertsView } from "@/comps/experts/ExpertsView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function ExpertsPage() {
	const t = useTranslations("experts.page");

	return <ChiefGate title={t("title")}>{(chief) => <ExpertsView chief={chief} />}</ChiefGate>;
}
