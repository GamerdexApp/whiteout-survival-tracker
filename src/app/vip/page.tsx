"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { VipView } from "@/comps/vip/VipView";

export default function VipPage() {
	const t = useTranslations("vip.page");

	return <ChiefGate title={t("title")}>{(chief) => <VipView chief={chief} />}</ChiefGate>;
}
