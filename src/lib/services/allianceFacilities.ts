import type {
  AllianceFacility,
  AllianceFortress,
  AllianceFortressKind,
} from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { facilities, fortresses } from "@/data/game/alliance";

export const ownedLevelsOf = (chief: Playthrough, facilityId: string) =>
  chief.allianceFacilities?.[facilityId]?.ownedLevels ?? [];

export const ownedFacilityLevelCount = (chief: Playthrough) =>
  facilities.reduce(
    (total, facility) =>
      total +
      facility.levels.filter((level) =>
        ownedLevelsOf(chief, facility.id).includes(level.level),
      ).length,
    0,
  );

export const FACILITY_LEVEL_COUNT = facilities.reduce(
  (total, facility) => total + facility.levels.length,
  0,
);

export const withFacilityLevelOwned = (
  chief: Playthrough,
  facilityId: string,
  level: number,
  owned: boolean,
): Playthrough => {
  const others = ownedLevelsOf(chief, facilityId).filter(
    (value) => value !== level,
  );
  const ownedLevels = owned ? [...others, level].sort((a, b) => a - b) : others;
  return {
    ...chief,
    allianceFacilities: {
      ...chief.allianceFacilities,
      [facilityId]: { ownedLevels },
    },
  };
};

export type OwnedFilter = "all" | "owned" | "notOwned";

export interface FacilityLevelView {
  level: AllianceFacility["levels"][number];
  owned: boolean;
}

export interface FacilityView {
  facility: AllianceFacility;
  ownedCount: number;
  levels: FacilityLevelView[];
}

/** The facility cards that match the Show filter. A card keeps only the levels that match. */
export const buildFacilityViews = (
  chief: Playthrough,
  show: OwnedFilter,
): FacilityView[] =>
  facilities.flatMap((facility) => {
    const held = ownedLevelsOf(chief, facility.id);
    const all = facility.levels.map((level) => ({
      level,
      owned: held.includes(level.level),
    }));
    const levels = all.filter(
      (item) => show === "all" || (show === "owned" ? item.owned : !item.owned),
    );
    return levels.length === 0
      ? []
      : [
          {
            facility,
            ownedCount: all.filter((item) => item.owned).length,
            levels,
          },
        ];
  });

export interface FortressCounts {
  castle: number;
  stronghold: number;
  fortress: number;
}

export const fortressCounts = (): FortressCounts => ({
  castle: fortresses.filter((item) => item.kind === "castle").length,
  stronghold: fortresses.filter((item) => item.kind === "stronghold").length,
  fortress: fortresses.filter((item) => item.kind === "fortress").length,
});

export interface FortressFilters {
  kind: AllianceFortressKind | "all";
  /** A reward text, such as Shards. */
  reward: string | "all";
}

export const defaultFortressFilters = (): FortressFilters => ({
  kind: "all",
  reward: "all",
});

export const countFortressFilters = (filters: FortressFilters) =>
  (filters.kind === "all" ? 0 : 1) + (filters.reward === "all" ? 0 : 1);

export const rewardChoices = (): string[] =>
  [
    ...new Set(
      fortresses.flatMap((item) => item.rewards.map((entry) => entry.reward)),
    ),
  ].sort((a, b) => a.localeCompare(b));

export const filterFortresses = (
  filters: FortressFilters,
): AllianceFortress[] =>
  fortresses.filter(
    (item) =>
      (filters.kind === "all" || item.kind === filters.kind) &&
      (filters.reward === "all" ||
        item.rewards.some((entry) => entry.reward === filters.reward)),
  );

export interface FacilitySpot {
  key: string;
  facilityId: string;
  code: string;
  level: number;
  x: number;
  y: number;
}

/** The two letter code of a facility on the map. The first two letters of the name are unique. */
export const facilityCodeOf = (facility: AllianceFacility) =>
  facility.name.slice(0, 2);

export const facilitySpots = (): FacilitySpot[] =>
  facilities.flatMap((facility) =>
    facility.levels.flatMap((level) =>
      level.locations.map((location, index) => ({
        key: `${facility.id}-${level.level}-${index}`,
        facilityId: facility.id,
        code: facilityCodeOf(facility),
        level: level.level,
        x: location.x,
        y: location.y,
      })),
    ),
  );
