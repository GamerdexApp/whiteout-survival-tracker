"use client";

import { useTranslations } from "next-intl";
import { AllianceView } from "@/comps/alliance/AllianceView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function AlliancePage() {
	const t = useTranslations("alliance.page");

	return <ChiefGate title={t("title")}>{(chief) => <AllianceView chief={chief} />}</ChiefGate>;
}
