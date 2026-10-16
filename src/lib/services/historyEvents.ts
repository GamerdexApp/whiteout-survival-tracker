import type {
  CoreEventId,
  EventHistoryEntry,
  PlannedUpgrade,
  Playthrough,
} from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import { SVS_BATTLE_DAY_ID } from "@/data/game/coreEvents";
import { findResearch } from "@/data/game/research";
import { buildView, findLevel } from "./buildings";
import { gearItems, ladderRows, positionOf } from "./chiefGear";
import {
  eventDaysOf,
  historyOf,
  isBattleDay,
  overallDaysOf,
  shownEventsOf,
} from "./coreEvents";
import { levelOfNode } from "./research";

export const FIRE_CRYSTAL_ID = "fire-crystal";

export interface Result {
  plan: number;
  actual: number;
  difference: number;
  /** The difference as a share of the plan. Null when the plan is 0. */
  percent: number | null;
}

const resultOf = (plan: number, actual: number): Result => ({
  plan,
  actual,
  difference: actual - plan,
  percent: plan === 0 ? null : ((actual - plan) / plan) * 100,
});

export const isAtOrAbovePlan = (result: { difference: number }) =>
  result.difference >= 0;

export interface Ranks {
  rank: number | undefined;
  allianceRank: number | undefined;
}

export interface HistoryRow extends Result, Ranks {
  event: CoreEventId;
  entry: EventHistoryEntry;
}

const sumOf = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

/** Plan and actual cover the days of the overall result. The Battle Phase is kept apart. */
export const summaryOf = (
  chief: Playthrough,
  event: CoreEventId,
  entry: EventHistoryEntry,
): Result & Ranks => {
  const days = overallDaysOf(event, chief);
  return {
    ...resultOf(
      sumOf(days.map((day) => entry.plan[day.id] ?? 0)),
      sumOf(days.map((day) => entry.days[day.id]?.score ?? 0)),
    ),
    rank: entry.overall.rank,
    allianceRank: entry.overall.allianceRank,
  };
};

export const endedEventsOf = (
  chief: Playthrough,
  filter: CoreEventId | "all",
): HistoryRow[] =>
  shownEventsOf(chief)
    .filter((event) => filter === "all" || event === filter)
    .flatMap((event) =>
      historyOf(chief, event).map((entry) => ({
        event,
        entry,
        ...summaryOf(chief, event, entry),
      })),
    )
    .sort((a, b) => b.entry.endedAt.localeCompare(a.entry.endedAt));

export const findEntry = (
  chief: Playthrough,
  event: string,
  entryId: string,
): { event: CoreEventId; entry: EventHistoryEntry } | null => {
  const shown = shownEventsOf(chief).find((id) => id === event);
  const entry = shown
    ? historyOf(chief, shown).find((item) => item.id === entryId)
    : undefined;
  return shown && entry ? { event: shown, entry } : null;
};

export interface DayRow extends Ranks {
  id: string;
  plan: number;
  /** Null when no score was typed for the day. */
  actual: number | null;
  difference: number | null;
  /** Actual as a share of the plan. */
  share: number;
}

const dayRowOf = (entry: EventHistoryEntry, id: string): DayRow => {
  const plan = entry.plan[id] ?? 0;
  const actual = entry.days[id]?.score ?? null;
  return {
    id,
    plan,
    actual,
    difference: actual === null ? null : actual - plan,
    share: plan === 0 || actual === null ? 0 : actual / plan,
    rank: entry.days[id]?.rank,
    allianceRank: entry.days[id]?.allianceRank,
  };
};

export const dayRowsOf = (
  chief: Playthrough,
  event: CoreEventId,
  entry: EventHistoryEntry,
): DayRow[] =>
  overallDaysOf(event, chief).map((day) => dayRowOf(entry, day.id));

/** The Battle Phase of SvS. Other events have none. */
export const battleRowOf = (
  chief: Playthrough,
  event: CoreEventId,
  entry: EventHistoryEntry,
): DayRow | null =>
  eventDaysOf(event, chief).some((day) => isBattleDay(event, day.id))
    ? dayRowOf(entry, SVS_BATTLE_DAY_ID)
    : null;

// ---------- Planned upgrades ----------

const PAGE_IDS = [
  "buildings",
  "research",
  "chiefGear",
  "chiefCharms",
  "heroGear",
  "heroes",
  "pets",
  "experts",
  "troops",
] as const;

export type UpgradePageId = (typeof PAGE_IDS)[number];

export const isKnownUpgradePage = (page: string): page is UpgradePageId =>
  (PAGE_IDS as readonly string[]).includes(page);

/**
 * Whether the chief reached the planned level. Done is never saved. It is null for a page the app
 * cannot read, an item the package does not know and a level the package does not know.
 */
export const upgradeDoneOf = (
  chief: Playthrough,
  upgrade: PlannedUpgrade,
): boolean | null => {
  if (upgrade.page === "buildings") {
    const building = findBuildingById(upgrade.itemId);
    const target = building && findLevel(building, upgrade.to);
    return building && target
      ? buildView(building, chief).order >= target.order
      : null;
  }
  if (upgrade.page === "research") {
    const node = findResearch(upgrade.itemId);
    const target = Number(upgrade.to);
    return node && Number.isFinite(target)
      ? levelOfNode(chief, node) >= target
      : null;
  }
  if (upgrade.page === "chiefGear") {
    const item = gearItems(chief).find(
      (gear) => gear.slotId === upgrade.itemId,
    );
    const target = positionOf("gear", upgrade.to);
    return item && target >= 0
      ? positionOf("gear", item.current) >= target
      : null;
  }
  return null;
};

export interface UpgradeLevels {
  from: string | null;
  to: string;
  /** Research levels are plain numbers and the sentence adds the word Level. */
  numeric: boolean;
}

const gearLevelName = (id: string) =>
  ladderRows("gear").find((row) => row.id === id)?.name ?? id;

export const upgradeLevelsOf = (upgrade: PlannedUpgrade): UpgradeLevels => {
  if (upgrade.page === "research") {
    return { from: upgrade.from, to: upgrade.to, numeric: true };
  }
  if (upgrade.page === "chiefGear") {
    return {
      from: upgrade.from === null ? null : gearLevelName(upgrade.from),
      to: gearLevelName(upgrade.to),
      numeric: false,
    };
  }
  return { from: upgrade.from, to: upgrade.to, numeric: false };
};

export interface UpgradeGroup {
  page: string;
  upgrades: PlannedUpgrade[];
  done: number;
  /** False when no upgrade of the group can be checked. */
  checkable: boolean;
  power: number;
  fireCrystals: number;
}

const fireCrystalsOf = (upgrade: PlannedUpgrade) =>
  sumOf(
    upgrade.cost
      .filter((line) => line.itemId === FIRE_CRYSTAL_ID)
      .map((line) => line.amount),
  );

export const upgradeGroupsOf = (
  chief: Playthrough,
  entry: EventHistoryEntry,
): UpgradeGroup[] => {
  const pages = [...new Set(entry.upgrades.map((upgrade) => upgrade.page))];
  return pages.map((page) => {
    const upgrades = entry.upgrades.filter((upgrade) => upgrade.page === page);
    const states = upgrades.map((upgrade) => upgradeDoneOf(chief, upgrade));
    return {
      page,
      upgrades,
      done: states.filter((state) => state === true).length,
      checkable: states.some((state) => state !== null),
      power: sumOf(upgrades.map((upgrade) => upgrade.power)),
      fireCrystals: sumOf(upgrades.map(fireCrystalsOf)),
    };
  });
};

export const costLinesOf = (upgrade: PlannedUpgrade) =>
  [...upgrade.cost].sort(
    (a, b) =>
      Number(b.itemId === FIRE_CRYSTAL_ID) -
      Number(a.itemId === FIRE_CRYSTAL_ID),
  );
