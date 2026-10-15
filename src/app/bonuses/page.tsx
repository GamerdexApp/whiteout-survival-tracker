"use client";

import { useTranslations } from "next-intl";
import { BonusesView } from "@/comps/bonuses/BonusesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function BonusesPage() {
	const t = useTranslations("bonuses");

	return <ChiefGate title={t("title")}>{(chief) => <BonusesView chief={chief} />}</ChiefGate>;
}
