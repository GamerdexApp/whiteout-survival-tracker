import type {
  Building,
  BuildingCategory,
  BuildingLevel,
} from "whiteout-survival-data";
import type { BuildingState, Playthrough } from "@/types/app";
import {
  allBuildings,
  entertainmentBuildings,
  furnace,
  FURNACE_ID,
  isEntertainment,
  levelledBuildings,
  MAX_SHELTERS,
  shelter,
  SHELTER_ID,
} from "@/data/game/buildings";

export const NOT_BUILT_LABEL = "Not built";

export const levelOrder = (
  building: Building,
  label: string | null | undefined,
) => building.levels.find((level) => level.label === label)?.order ?? 0;

export const findLevel = (
  building: Building,
  label: string | null | undefined,
) => building.levels.find((level) => level.label === label);

export const maxOrder = (building: Building) =>
  building.levels[building.levels.length - 1].order;

/**
 * Returns the label when the building has such a level. A label from an old or edited save that
 * the package does not know reads as not built.
 */
export const knownLabel = (
  building: Building,
  label: string | null | undefined,
) => findLevel(building, label)?.label ?? null;

export const requirementText = (requirement: {
  building: string;
  level: number | string;
}) => {
  if (/^Shelter \d+$/.test(requirement.building)) {
    return `${requirement.building} at level ${requirement.level}`;
  }
  if (requirement.building === "Hero Hall") return "Hero Hall built";
  return `${requirement.building} ${requirement.level}`;
};

export interface BuildingView {
  building: Building;
  level: string | null;
  goal: string | null;
  order: number;
  goalOrder: number;
  hasGoal: boolean;
  maxed: boolean;
  built: boolean;
  lockedBy: string | null;
  blockedBy: string[];
  reachable: string | null;
  next: BuildingLevel | undefined;
  needs: string[];
  held: string[];
  progress: number;
  power: number | null;
  developmentIndex: number | null;
}

/**
 * Every shelter has its own level, kept in `instances`. A save from before that field existed has
 * one shelter, held in `level`. The other buildings are one entry.
 */
export const shelterLevels = (state: BuildingState | undefined): string[] =>
  (state?.instances ?? (state?.level ? [state.level] : [])).filter(
    (label) => knownLabel(shelter, label) !== null,
  );

const heldLabels = (building: Building, state: BuildingState) =>
  building.id === SHELTER_ID
    ? shelterLevels(state)
    : [knownLabel(building, state.level)].filter(
        (label): label is string => label !== null,
      );

const normalizeName = (name: string) => name.toLowerCase().replace(/'/g, "");

const buildingByName = new Map(
  allBuildings.map((building) => [normalizeName(building.name), building]),
);

const HERO_HALL_NAME = "Hero Hall";
const HERO_HALL_FACILITY_ID = "hero-hall";

type Requirement = { building: string; level: number | string };

const orderOfTracked = (building: Building, chief: Playthrough) =>
  isEntertainment(building)
    ? chief.buildings?.[building.id]?.built === true
      ? 1
      : 0
    : levelOrder(building, chief.buildings?.[building.id]?.level);

const isMet = (requirement: Requirement, chief: Playthrough) => {
  const shelterNumber = /^Shelter (\d+)$/.exec(requirement.building)?.[1];
  if (shelterNumber) {
    const held = shelterLevels(chief.buildings?.[SHELTER_ID]);
    return (
      levelOrder(shelter, held[Number(shelterNumber) - 1]) >=
      levelOrder(shelter, String(requirement.level))
    );
  }
  if (requirement.building === HERO_HALL_NAME) {
    return chief.facilities?.[HERO_HALL_FACILITY_ID]?.built === true;
  }

  const target = buildingByName.get(normalizeName(requirement.building));
  if (!target) return true;
  return (
    orderOfTracked(target, chief) >=
    levelOrder(target, String(requirement.level))
  );
};

const isAppRule = (requirement: Requirement) =>
  requirement.building === HERO_HALL_NAME ||
  /^Shelter \d+$/.test(requirement.building);

/**
 * The requirements of one level that the chief does not meet yet. A requirement on the building
 * itself is skipped, because a level always follows the one before it. A requirement on something
 * the app does not track is treated as met. `trackedBuildingsOnly` also skips the Hero Hall and the
 * numbered shelters, which the Mass edit dialog cannot set.
 */
export const unmetRequirements = (
  building: Building,
  level: BuildingLevel,
  chief: Playthrough,
  trackedBuildingsOnly = false,
) =>
  (level.prerequisites ?? []).filter(
    (requirement) =>
      requirement.building !== building.name &&
      !(trackedBuildingsOnly && isAppRule(requirement)) &&
      !isMet(requirement, chief),
  );

/**
 * The highest level the chief can reach from `fromOrder` now. Every level on the way must have
 * its requirements met, so one blocked level stops the climb.
 */
export const reachableLevel = (
  building: Building,
  fromOrder: number,
  chief: Playthrough,
  trackedBuildingsOnly = false,
): string | null => {
  let reached = fromOrder;
  for (const level of building.levels.filter(
    (item) => item.order > fromOrder,
  )) {
    if (
      unmetRequirements(building, level, chief, trackedBuildingsOnly).length > 0
    )
      break;
    reached = level.order;
  }
  return (
    building.levels.find((level) => level.order === reached)?.label ?? null
  );
};

export const buildView = (
  building: Building,
  chief: Playthrough,
): BuildingView => {
  const state: BuildingState = chief.buildings?.[building.id] ?? {};

  if (isEntertainment(building)) {
    const built = state.built === true;
    const only = building.levels[0];
    const unmet = built ? [] : unmetRequirements(building, only, chief);
    return {
      building,
      level: built ? only.label : null,
      goal: null,
      order: built ? only.order : 0,
      goalOrder: 0,
      hasGoal: false,
      maxed: built,
      built,
      lockedBy: unmet.length > 0 ? unmet.map(requirementText).join(", ") : null,
      blockedBy: [],
      reachable: built ? only.label : null,
      next: built ? undefined : only,
      needs: (only.prerequisites ?? []).map(requirementText),
      held: built ? [only.label] : [],
      progress: built ? 1 : 0,
      power: built ? only.power : null,
      developmentIndex: built ? only.developmentIndex : null,
    };
  }

  const held = heldLabels(building, state);
  const heldLevels = held.map((label) => findLevel(building, label)!);
  const lowest = heldLevels.reduce<BuildingLevel | undefined>(
    (low, candidate) => (low && low.order <= candidate.order ? low : candidate),
    undefined,
  );
  const level = lowest?.label ?? null;
  const order = lowest?.order ?? 0;
  const goal = knownLabel(building, state.goal);
  const goalOrder = levelOrder(building, goal);
  const next = building.levels.find((candidate) => candidate.order > order);
  const blockedBy = next
    ? unmetRequirements(building, next, chief).map(requirementText)
    : [];

  return {
    building,
    level,
    goal,
    order,
    goalOrder,
    hasGoal: goalOrder > order,
    maxed: next === undefined,
    built: order > 0,
    lockedBy: order === 0 && blockedBy.length > 0 ? blockedBy.join(", ") : null,
    blockedBy,
    reachable: reachableLevel(building, order, chief),
    next,
    needs: (next?.prerequisites ?? [])
      .filter((item) => item.building !== building.name)
      .map(requirementText),
    held,
    progress:
      heldLevels.length === 0
        ? 0
        : heldLevels.reduce((sum, item) => sum + item.order, 0) /
          (heldLevels.length * maxOrder(building)),
    power:
      heldLevels.length === 0
        ? null
        : heldLevels.reduce((sum, item) => sum + item.power, 0),
    developmentIndex:
      heldLevels.length === 0
        ? null
        : heldLevels.reduce((sum, item) => sum + item.developmentIndex, 0),
  };
};

export const buildViews = (chief: Playthrough) =>
  allBuildings.map((building) => buildView(building, chief));

export interface BuildingSummary {
  furnaceLevel: string | null;
  power: number;
  developmentIndex: number;
  withGoal: number;
  atMax: number;
  entertainmentBuilt: number;
}

export const summarize = (views: BuildingView[]): BuildingSummary => {
  const levelled = views.filter((view) => !isEntertainment(view.building));
  return {
    furnaceLevel:
      views.find((view) => view.building.id === FURNACE_ID)?.level ?? null,
    power: views.reduce((sum, view) => sum + (view.power ?? 0), 0),
    developmentIndex: views.reduce(
      (sum, view) => sum + (view.developmentIndex ?? 0),
      0,
    ),
    withGoal: levelled.filter((view) => view.hasGoal).length,
    atMax: levelled.filter((view) => view.maxed && view.built).length,
    entertainmentBuilt: views.filter(
      (view) => isEntertainment(view.building) && view.built,
    ).length,
  };
};

export type BuildingOrder = "game" | "name" | "progress";

export interface BuildingFilters {
  search: string;
  category: "all" | BuildingCategory;
  hideMaxed: boolean;
  hideLocked: boolean;
  goalsOnly: boolean;
  order: BuildingOrder;
}

export const defaultBuildingFilters = (
  hideMaxed: boolean,
): BuildingFilters => ({
  search: "",
  category: "all",
  hideMaxed,
  hideLocked: false,
  goalsOnly: false,
  order: "game",
});

const matchesSearch = (view: BuildingView, search: string) =>
  view.building.name.toLowerCase().includes(search.trim().toLowerCase());

const matchesFilters = (view: BuildingView, filters: BuildingFilters) =>
  (filters.category === "all" || view.building.category === filters.category) &&
  !(filters.hideMaxed && view.maxed && view.built) &&
  !(filters.hideLocked && view.lockedBy !== null) &&
  !(filters.goalsOnly && !view.hasGoal);

const orderers: Record<
  BuildingOrder,
  (a: BuildingView, b: BuildingView) => number
> = {
  game: () => 0,
  name: (a, b) => a.building.name.localeCompare(b.building.name),
  progress: (a, b) => a.progress - b.progress,
};

/**
 * Furnace is pinned and ignores every filter except search. The rest follow the filters.
 */
export const filterViews = (
  views: BuildingView[],
  filters: BuildingFilters,
) => {
  const searched = views.filter((view) => matchesSearch(view, filters.search));
  const pinned = searched.filter((view) => view.building.id === FURNACE_ID);
  const rest = searched
    .filter(
      (view) =>
        view.building.id !== FURNACE_ID && matchesFilters(view, filters),
    )
    .sort(orderers[filters.order]);
  return { pinned, rest, shown: pinned.length + rest.length };
};

export const countActiveFilters = (
  filters: BuildingFilters,
  hideMaxedDefault: boolean,
) =>
  [
    filters.category !== "all",
    filters.hideMaxed !== hideMaxedDefault,
    filters.hideLocked,
    filters.goalsOnly,
    filters.order !== "game",
  ].filter(Boolean).length;

const withBuildingState = (
  chief: Playthrough,
  buildingId: string,
  patch: BuildingState,
): Playthrough => ({
  ...chief,
  buildings: {
    ...chief.buildings,
    [buildingId]: { ...chief.buildings?.[buildingId], ...patch },
  },
});

export const withLevel = (
  chief: Playthrough,
  buildingId: string,
  level: string | null,
) => withBuildingState(chief, buildingId, { level });

/**
 * Saves the level of every shelter. `level` mirrors the lowest shelter, the next one to upgrade, so
 * the plan and the progress bar read one level for the Shelter entry.
 */
export const withShelterLevels = (
  chief: Playthrough,
  levels: string[],
): Playthrough => {
  const held = levels.slice(0, MAX_SHELTERS);
  const lowest = held.reduce<string | null>(
    (low, label) =>
      low === null || levelOrder(shelter, label) < levelOrder(shelter, low)
        ? label
        : low,
    null,
  );
  return withBuildingState(chief, SHELTER_ID, {
    instances: held,
    level: lowest,
  });
};

export const withBuilt = (
  chief: Playthrough,
  buildingId: string,
  built: boolean,
) => withBuildingState(chief, buildingId, { built });

export const withFacilityBuilt = (
  chief: Playthrough,
  facilityId: string,
  built: boolean,
) => ({
  ...chief,
  facilities: { ...chief.facilities, [facilityId]: { built } },
});

export const levelledBuildingLevels = (chief: Playthrough) =>
  Object.fromEntries(
    levelledBuildings.flatMap((building) => {
      const label = knownLabel(building, chief.buildings?.[building.id]?.level);
      return label ? [[building.id, label]] : [];
    }),
  );

export const entertainmentCount = entertainmentBuildings.length;

export interface ShelterRequirement {
  furnaceLevel: string;
  shelterNumber: number;
  level: number;
  met: boolean;
}

/**
 * Some Furnace levels name a numbered shelter at a level, for example Shelter 3 at level 3. The
 * package keeps these as plain text, so this reads the number out of the building name.
 */
export const shelterRequirements = (held: string[]): ShelterRequirement[] =>
  furnace.levels.flatMap((furnaceLevel) =>
    (furnaceLevel.prerequisites ?? []).flatMap((requirement) => {
      const number = /^Shelter (\d+)$/.exec(requirement.building)?.[1];
      if (!number) return [];
      const level = Number(requirement.level);
      const shelterNumber = Number(number);
      return [
        {
          furnaceLevel: furnaceLevel.label,
          shelterNumber,
          level,
          met: levelOrder(shelter, held[shelterNumber - 1]) >= level,
        },
      ];
    }),
  );
