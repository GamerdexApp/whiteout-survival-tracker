"use client";

import { useTranslations } from "next-intl";
import { DaybreakView } from "@/comps/daybreak/DaybreakView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function DaybreakIslandPage() {
	const t = useTranslations("daybreak.page");

	return <ChiefGate title={t("title")}>{(chief) => <DaybreakView chief={chief} />}</ChiefGate>;
}
