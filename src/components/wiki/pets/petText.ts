import { translator } from "@/i18n/formatter";
import type { Pet } from "whiteout-survival-data";
import { formatNumber } from "@/lib/format";

export const unlockRequirementText = (pet: Pet) => {
  const t = translator("wikiPets");
  const { daysRequired, furnaceLevel, prerequisitePet } = pet.unlockRequirement;
  const days = formatNumber(daysRequired);

  if (furnaceLevel !== undefined) {
    return t("unlock.withFurnace", { days, level: formatNumber(furnaceLevel) });
  }
  if (prerequisitePet) {
    return t("unlock.withPet", {
      days,
      pet: prerequisitePet.name,
      level: formatNumber(prerequisitePet.level),
    });
  }
  return t("unlock.daysOnly", { days });
};
