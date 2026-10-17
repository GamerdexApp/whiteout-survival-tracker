import type {
  AllianceBannerLevel,
  AllianceFacility,
  AllianceFacilityLevel,
  AllianceFortress,
  AllianceFortressKind,
} from "whiteout-survival-data";
import { bannerRanges, facilities, fortresses } from "@/data/game/alliance";

export type StructureFilter =
  "all" | "banners" | "facilities" | AllianceFortressKind;

export const structureFilters: StructureFilter[] = [
  "all",
  "banners",
  "facilities",
  "castle",
  "stronghold",
  "fortress",
];

export const showsBanners = (filter: StructureFilter) =>
  filter === "all" || filter === "banners";

export const showsFacilities = (filter: StructureFilter) =>
  filter === "all" || filter === "facilities";

export const showsFortresses = (filter: StructureFilter) =>
  filter !== "banners" && filter !== "facilities";

const matches = (query: string, ...texts: string[]) =>
  !query || texts.some((text) => text.toLowerCase().includes(query));

const normalize = (query: string) => query.trim().toLowerCase();

export const filterBanners = (query: string): AllianceBannerLevel[] =>
  bannerRanges.filter((range) => matches(normalize(query), range.name));

export const filterFacilities = (query: string): AllianceFacility[] =>
  facilities.filter((facility) =>
    matches(normalize(query), facility.name, facility.bonusStat),
  );

export const filterFortresses = (
  query: string,
  filter: StructureFilter,
): AllianceFortress[] =>
  fortresses.filter(
    (fortress) =>
      (filter === "all" || filter === fortress.kind) &&
      matches(normalize(query), fortress.name, fortress.kind),
  );

/** The level numbers that any facility lists. A facility without one of them has a gap at that level. */
export const FACILITY_LEVEL_NUMBERS = Array.from(
  {
    length: Math.max(
      ...facilities.flatMap((facility) =>
        facility.levels.map((level) => level.level),
      ),
    ),
  },
  (_, index) => index + 1,
);

export const facilityLevelAt = (
  facility: AllianceFacility,
  level: number,
): AllianceFacilityLevel | undefined =>
  facility.levels.find((entry) => entry.level === level);
