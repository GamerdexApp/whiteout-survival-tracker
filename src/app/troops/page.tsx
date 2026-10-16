"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { TroopsView } from "@/comps/troops/TroopsView";

export default function TroopsPage() {
	const t = useTranslations("troops.page");

	return <ChiefGate title={t("title")}>{(chief) => <TroopsView chief={chief} />}</ChiefGate>;
}
