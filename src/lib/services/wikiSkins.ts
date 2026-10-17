import { allSkins } from "@/data/game/wikiSkins";
import type { Skin, SkinType } from "@/data/game/wikiSkins";

export type DurationFilter = "any" | "permanent" | "timed" | "notStated";

export const ANY_STAT = "any";
export const NO_BONUS = "none";

export interface SkinFilters {
  search: string;
  skinType: SkinType | undefined;
  stat: string;
  duration: DurationFilter;
}

export const bonusStatNames: string[] = [
  ...new Set(allSkins.flatMap((skin) => (skin.bonus ? [skin.bonus.stat] : []))),
].sort((a, b) => a.localeCompare(b));

const DURATION_AFTER_NAME = /\[[^\]]*\]\s*\(([^)]+)\)/;

/** The package has no duration field. The description writes it in brackets after the name. */
export const skinDuration = (skin: Skin) =>
  DURATION_AFTER_NAME.exec(skin.description)?.[1];

const matchesDuration = (skin: Skin, duration: DurationFilter) => {
  const text = skinDuration(skin);
  if (duration === "any") return true;
  if (duration === "notStated") return text === undefined;
  if (text === undefined) return false;
  const permanent = text.toLowerCase().startsWith("permanent");
  return duration === "permanent" ? permanent : !permanent;
};

const matchesStat = (skin: Skin, stat: string) => {
  if (stat === ANY_STAT) return true;
  if (stat === NO_BONUS) return skin.bonus === undefined;
  return skin.bonus?.stat === stat;
};

const matchesSearch = (skin: Skin, search: string) => {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;
  return [skin.name, ...skin.sources].some((text) =>
    text.toLowerCase().includes(needle),
  );
};

export const filterSkins = (filters: SkinFilters) =>
  allSkins.filter(
    (skin) =>
      (filters.skinType === undefined || skin.skinType === filters.skinType) &&
      matchesStat(skin, filters.stat) &&
      matchesDuration(skin, filters.duration) &&
      matchesSearch(skin, filters.search),
  );

export const countSkinsOfType = (skinType: SkinType) =>
  allSkins.filter((skin) => skin.skinType === skinType).length;
