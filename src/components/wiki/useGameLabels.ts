import { useTranslations } from "next-intl";

export type RarityId =
  "Common" | "Uncommon" | "Rare" | "Epic" | "Mythic" | "Legendary";
type ClassId = "Infantry" | "Lancer" | "Marksman";
type SubClassId = "Growth" | "Combat";

const RARITY_TIER_NAME = /^([A-Za-z]+?) ?(T\d+)?$/;

const CLASS_OF_TROOP_ID = {
  infantry: "Infantry",
  lancer: "Lancer",
  marksman: "Marksman",
} as const;

/** Turns the English ids of the package data into the text of the chosen language. */
export function useGameLabels() {
  const t = useTranslations("gameLabels");

  return {
    rarity: (id: RarityId) => t(`rarities.${id}`),
    heroClass: (id: ClassId) => t(`classes.${id}`),
    /** A rarity with an optional tier suffix, for example "Epic T1". */
    rarityTier: (name: string) => {
      const [, rarity, tier] = RARITY_TIER_NAME.exec(name) as RegExpExecArray;
      const label = t(`rarities.${rarity as RarityId}`);
      return tier ? `${label} ${tier}` : label;
    },
    subClass: (id: SubClassId) => t(`subClasses.${id}`),
    troopId: (id: keyof typeof CLASS_OF_TROOP_ID) =>
      t(`classes.${CLASS_OF_TROOP_ID[id]}`),
  };
}
