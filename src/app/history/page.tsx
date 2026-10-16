"use client";

import { useTranslations } from "next-intl";
import { HistoryView } from "@/comps/history/HistoryView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function HistoryPage() {
	const t = useTranslations("history.page");

	return <ChiefGate title={t("title")}>{(chief) => <HistoryView chief={chief} />}</ChiefGate>;
}
