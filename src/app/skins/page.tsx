"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { SkinsView } from "@/comps/skins/SkinsView";

export default function SkinsPage() {
	const t = useTranslations("skins.page");

	return <ChiefGate title={t("title")}>{(chief) => <SkinsView chief={chief} />}</ChiefGate>;
}
