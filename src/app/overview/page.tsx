"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { OverviewView } from "@/comps/overview/OverviewView";

export default function OverviewPage() {
	const t = useTranslations("overview.page");

	return <ChiefGate title={t("title")}>{(chief) => <OverviewView chief={chief} />}</ChiefGate>;
}
