"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { allPets, findPet } from "@/data/game/pets";
import { PetDetail } from "../pets/PetDetail";
import { PetRoster } from "../pets/PetRoster";
import { useGameLabels } from "../useGameLabels";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function PetsPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiPets");
	const labels = useGameLabels();

	if (recordId === undefined) {
		return (
			<WikiPageShell id="pets" line={t("line", { pets: formatNumber(allPets.length) })}>
				<PetRoster />
			</WikiPageShell>
		);
	}

	const pet = findPet(recordId);
	if (!pet) return <WikiRecordMissing id="pets" />;

	return (
		<WikiPageShell
			id="pets"
			recordName={pet.name}
			line={t("recordLine", {
				rarity: labels.rarity(pet.rarity),
				level: formatNumber(pet.maxLevel),
			})}
		>
			<PetDetail pet={pet} />
		</WikiPageShell>
	);
}
