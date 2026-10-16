"use client";

import { useTranslations } from "next-intl";
import { EventsView } from "@/comps/events/EventsView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function EventsPage() {
	const t = useTranslations("events.page");

	return <ChiefGate title={t("title")}>{(chief) => <EventsView chief={chief} />}</ChiefGate>;
}
