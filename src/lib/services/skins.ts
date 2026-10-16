import type { Skin, SkinType } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { allSkins, skinTypes } from "@/data/game/skins";

const DOMAIN_BONUS_TEXT = "Domain Bonus";

export type OwnedFilter = "all" | "owned" | "notOwned";
export type BonusFilter = "any" | "has" | "none";
export type SkinOrder = "game" | "name" | "owned";

export interface SkinFilters {
  search: string;
  skinType: "all" | SkinType;
  owned: OwnedFilter;
  bonus: BonusFilter;
  order: SkinOrder;
}

export interface SkinView {
  skin: Skin;
  owned: boolean;
  hasDomainBonus: boolean;
}

export interface StatTotal {
  statKey: string;
  stat: string;
  amount: number;
  unit: string | undefined;
}

export interface SkinsSummary {
  owned: number;
  total: number;
  withBonus: number;
  ownedWithBonus: number;
}

export const isSkinOwned = (chief: Playthrough, id: string) =>
  chief.skins?.[id]?.owned === true;

export const buildSkinViews = (chief: Playthrough): SkinView[] =>
  allSkins.map((skin) => ({
    skin,
    owned: isSkinOwned(chief, skin.id),
    hasDomainBonus: skin.description.includes(DOMAIN_BONUS_TEXT),
  }));

export const withSkinOwned = (
  chief: Playthrough,
  id: string,
  owned: boolean,
): Playthrough => {
  const next = { ...chief.skins };
  if (owned) next[id] = { owned: true };
  else delete next[id];
  return { ...chief, skins: next };
};

/** The ids for `BuffProfile.skins` of the package buff calculator. */
export const skinBuffInputs = (chief: Playthrough): string[] =>
  allSkins.filter((skin) => isSkinOwned(chief, skin.id)).map((skin) => skin.id);

export const summarizeSkins = (views: SkinView[]): SkinsSummary => ({
  owned: views.filter((view) => view.owned).length,
  total: views.length,
  withBonus: views.filter((view) => view.skin.bonus).length,
  ownedWithBonus: views.filter((view) => view.owned && view.skin.bonus).length,
});

const roundHundredths = (value: number) => Math.round(value * 100) / 100;

/**
 * Adds the bonus of every owned skin per stat key. The package gives the singular names
 * "Troop Attack" and "Troop Defense" the same key as the plural names, so they add together.
 */
export const ownedBonusTotals = (views: SkinView[]): StatTotal[] => {
  const totals = new Map<string, StatTotal>();
  for (const { skin, owned } of views) {
    if (!owned || !skin.bonus) continue;
    const { statKey, stat, amount, unit } = skin.bonus;
    const known = totals.get(statKey);
    totals.set(statKey, {
      statKey,
      stat: known && known.stat.length > stat.length ? known.stat : stat,
      amount: (known?.amount ?? 0) + amount,
      unit,
    });
  }
  return [...totals.values()]
    .map((total) => ({ ...total, amount: roundHundredths(total.amount) }))
    .sort((a, b) => b.amount - a.amount);
};

export const typeCounts = (views: SkinView[]) =>
  new Map(
    skinTypes.map((skinType) => [
      skinType,
      views.filter((view) => view.skin.skinType === skinType).length,
    ]),
  );

export const defaultSkinFilters = (): SkinFilters => ({
  search: "",
  skinType: "all",
  owned: "all",
  bonus: "any",
  order: "game",
});

export const countSkinFilters = (filters: SkinFilters) =>
  [
    filters.skinType !== "all",
    filters.owned !== "all",
    filters.bonus !== "any",
    filters.order !== "game",
  ].filter(Boolean).length;

const matchesSearch = (skin: Skin, search: string) =>
  skin.name.toLowerCase().includes(search) ||
  skin.sources.some((source) => source.toLowerCase().includes(search));

export const filterSkinViews = (
  views: SkinView[],
  filters: SkinFilters,
): SkinView[] => {
  const search = filters.search.trim().toLowerCase();
  const kept = views.filter(
    ({ skin, owned }) =>
      (search === "" || matchesSearch(skin, search)) &&
      (filters.skinType === "all" || skin.skinType === filters.skinType) &&
      (filters.owned === "all" || owned === (filters.owned === "owned")) &&
      (filters.bonus === "any" ||
        (skin.bonus !== undefined) === (filters.bonus === "has")),
  );
  if (filters.order === "name") {
    return [...kept].sort((a, b) => a.skin.name.localeCompare(b.skin.name));
  }
  if (filters.order === "owned") {
    return [...kept].sort((a, b) => Number(b.owned) - Number(a.owned));
  }
  return kept;
};
