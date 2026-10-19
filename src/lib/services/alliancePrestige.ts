import type { Playthrough } from "@/types/app";
import { findPrestigeBuilding, prestigeBuildings } from "@/data/game/alliance";

const GATHERING_SPEED_STAT = "resource-gathering-speed";

/**
 * The tier that the alliance holds of a prestige building, or null when there is none. A saved tier
 * that the package does not know counts as none, so an edited save cannot make the calculator
 * throw.
 */
export const prestigeTierOf = (
  chief: Playthrough,
  buildingId: string,
): string | null => {
  const tier = chief.alliance?.prestige?.[buildingId];
  const known = findPrestigeBuilding(buildingId)?.levels.some(
    (level) => level.name === tier,
  );
  return known && tier !== undefined ? tier : null;
};

export const withPrestigeTier = (
  chief: Playthrough,
  buildingId: string,
  tier: string | null,
): Playthrough => {
  const others = Object.fromEntries(
    Object.entries(chief.alliance?.prestige ?? {}).filter(
      ([id]) => id !== buildingId,
    ),
  );
  return {
    ...chief,
    alliance: {
      ...chief.alliance,
      prestige: tier === null ? others : { ...others, [buildingId]: tier },
    },
  };
};

/** The tier of each held prestige building, in the shape of the buff profile. */
export const prestigeBuffInput = (chief: Playthrough) =>
  Object.fromEntries(
    prestigeBuildings.flatMap((building) => {
      const tier = prestigeTierOf(chief, building.id);
      return tier === null ? [] : [[building.id, tier]];
    }),
  );

/** The gathering speed percent of one tier. It applies to meat, wood, coal and iron each. */
export const prestigeTierPercent = (buildingId: string, tier: string | null) =>
  findPrestigeBuilding(buildingId)
    ?.levels.find((level) => level.name === tier)
    ?.bonuses.filter((bonus) => bonus.statKey === GATHERING_SPEED_STAT)
    .reduce((sum, bonus) => sum + bonus.amount, 0) ?? 0;

export const prestigeGatheringPercent = (chief: Playthrough) =>
  prestigeBuildings.reduce(
    (sum, building) =>
      sum +
      prestigeTierPercent(building.id, prestigeTierOf(chief, building.id)),
    0,
  );
