"use client";

import { useTranslations } from "next-intl";
import { LabyrinthView } from "@/comps/labyrinth/LabyrinthView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function LabyrinthPage() {
	const t = useTranslations("labyrinth.page");

	return <ChiefGate title={t("title")}>{(chief) => <LabyrinthView chief={chief} />}</ChiefGate>;
}
