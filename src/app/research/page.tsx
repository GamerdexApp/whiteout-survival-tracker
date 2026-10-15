"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { ResearchView } from "@/comps/research/ResearchView";

export default function ResearchPage() {
	const t = useTranslations("research");

	return <ChiefGate title={t("title")}>{(chief) => <ResearchView chief={chief} />}</ChiefGate>;
}
