"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { ResourcesView } from "@/comps/resources/ResourcesView";

export default function ResourcesPage() {
	const t = useTranslations("resources");

	return <ChiefGate title={t("title")}>{(chief) => <ResourcesView chief={chief} />}</ChiefGate>;
}
