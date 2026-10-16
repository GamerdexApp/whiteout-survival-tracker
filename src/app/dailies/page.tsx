"use client";

import { useTranslations } from "next-intl";
import { DailiesView } from "@/comps/dailies/DailiesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function DailiesPage() {
	const t = useTranslations("dailies.page");

	return <ChiefGate title={t("title")}>{(chief) => <DailiesView chief={chief} />}</ChiefGate>;
}
