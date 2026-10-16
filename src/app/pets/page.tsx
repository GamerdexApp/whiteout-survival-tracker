"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { PetsView } from "@/comps/pets/PetsView";

export default function PetsPage() {
	const t = useTranslations("pets.page");

	return <ChiefGate title={t("title")}>{(chief) => <PetsView chief={chief} />}</ChiefGate>;
}
