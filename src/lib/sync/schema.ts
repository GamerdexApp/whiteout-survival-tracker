import type { Schema } from "@gamerdexapp/gamerdex-sync";

/** For each building id, the order of its level labels in the game. */
export type BuildingLevelOrders = Record<string, Record<string, number>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const deep = (depth: number): Schema =>
  depth === 0 ? { type: "record" } : { type: "object", each: deep(depth - 1) };

const level: Schema = { type: "max", order: (value) => Number(value) };

const flag: Schema = { type: "max", order: (value) => (value ? 1 : 0) };

const savedAtOrder = (value: unknown) =>
  isRecord(value) && typeof value.savedAt === "string"
    ? Date.parse(value.savedAt) || 0
    : 0;

const newest: Schema = { type: "max", order: savedAtOrder };

const modifiedOrder = (value: unknown) =>
  typeof value === "string" ? Date.parse(value) || 0 : 0;

const buildingEntry = (orders: Record<string, number> | undefined): Schema => ({
  type: "object",
  fields: {
    level: {
      type: "max",
      order: (value) =>
        typeof value === "string" ? (orders?.[value] ?? 0) : 0,
    },
    built: flag,
    instances: { type: "join" },
  },
  each: deep(2),
});

const hero: Schema = {
  type: "object",
  fields: {
    owned: flag,
    star: level,
    tier: level,
    level,
    talent: level,
    weapon: level,
    skills: { type: "object", each: level },
  },
  each: deep(2),
};

const planFields = [
  "buildingPlan",
  "researchPlan",
  "heroesPlan",
  "heroGearPlan",
  "chiefGearPlan",
  "chiefCharmsPlan",
  "troopsPlan",
  "expertsPlan",
  "petsPlan",
] as const;

/**
 * Says how the saved data of the tracker merges. Levels take the higher value and plans take the
 * newer plan. A list of log entries joins. The active chief stays on the device. Everything else
 * merges value by value and reports a conflict when two devices changed the same value.
 */
export const createSyncSchema = (orders: BuildingLevelOrders): Schema => {
  const buildings: Schema = {
    type: "object",
    fields: Object.fromEntries(
      Object.entries(orders).map(([id, levels]) => [id, buildingEntry(levels)]),
    ),
    each: buildingEntry(undefined),
  };

  const chief: Schema = {
    type: "object",
    deleteWins: true,
    fields: {
      id: { type: "record" },
      lastModified: { type: "max", order: modifiedOrder },
      buildings,
      facilities: { type: "object", each: { type: "object", each: flag } },
      research: { type: "object", each: { type: "object", each: level } },
      heroes: { type: "object", each: hero },
      heroGear: {
        type: "object",
        fields: { sets: { type: "keyed", key: "id", item: deep(4) } },
      },
      upgradeLog: { type: "join" },
      eventResults: { type: "keyed", key: "id", item: { type: "record" } },
      ...Object.fromEntries(planFields.map((name) => [name, newest])),
    },
    each: deep(6),
  };

  return {
    type: "object",
    fields: {
      playthroughs: { type: "keyed", key: "id", item: chief },
      activePlaythroughId: { type: "local" },
      settings: { type: "object", each: deep(3) },
    },
  };
};
