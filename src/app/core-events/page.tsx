"use client";

import { useTranslations } from "next-intl";
import { CoreEventsView } from "@/comps/core-events/CoreEventsView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function CoreEventsPage() {
	const t = useTranslations("coreEvents.page");

	return <ChiefGate title={t("title")}>{(chief) => <CoreEventsView chief={chief} />}</ChiefGate>;
}
