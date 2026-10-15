"use client";

import { useTranslations } from "next-intl";
import { HeroesView } from "@/comps/heroes/HeroesView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function HeroesPage() {
	const t = useTranslations("heroes.page");

	return <ChiefGate title={t("title")}>{(chief) => <HeroesView chief={chief} />}</ChiefGate>;
}
