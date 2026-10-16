"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { TechView } from "@/comps/tech/TechView";

export default function TechPage() {
	const t = useTranslations("tech.page");

	return <ChiefGate title={t("title")}>{(chief) => <TechView chief={chief} />}</ChiefGate>;
}
