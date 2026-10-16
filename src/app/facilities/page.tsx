"use client";

import { useTranslations } from "next-intl";
import { FacilitiesView } from "@/comps/facilities/FacilitiesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function FacilitiesPage() {
	const t = useTranslations("facilities.page");

	return <ChiefGate title={t("title")}>{(chief) => <FacilitiesView chief={chief} />}</ChiefGate>;
}
