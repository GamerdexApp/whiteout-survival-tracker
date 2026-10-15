"use client";

import { useTranslations } from "next-intl";
import { ChiefGearView } from "@/comps/chief-gear/ChiefGearView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function ChiefGearPage() {
	const t = useTranslations("chiefGear.view");
	return <ChiefGate title={t("title")}>{(chief) => <ChiefGearView chief={chief} />}</ChiefGate>;
}
