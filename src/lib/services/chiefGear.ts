import { formatNumber, translator } from "@/i18n/formatter";
import {
  calculateChiefCharm,
  calculateChiefGear,
} from "whiteout-survival-data";
import type { UpgradeResult } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import {
  charmLevels,
  chiefGearSetBonus,
  chiefGearSlotList,
  gearLevels,
  setBonusTierName,
} from "@/data/game/chiefGear";
import { findItem } from "@/data/game/items";
import { ownedCount } from "./inventory";
import type { StockCheck } from "./planStock";
import {
  charmUnlockDay,
  gearUnlockDay,
  isCharmLevelUnlocked,
  isGearTierUnlocked,
  unlockText,
} from "./unlocks";

export type LadderKind = "gear" | "charm";

export interface LadderRow {
  id: string;
  name: string;
  statTotalPercent: number;
  powerTotal: number;
  score: number;
  troopsDeploymentCapacity?: number;
  tier?: string;
  stars?: number;
  level?: number;
}

export const ladderRows = (kind: LadderKind): readonly LadderRow[] =>
  kind === "gear" ? gearLevels : charmLevels;

export const NONE_STOP = "none";

const rowUnlockDay = (kind: LadderKind, row: LadderRow) =>
  kind === "gear"
    ? gearUnlockDay(row.tier ?? "Common")
    : charmUnlockDay(row.level ?? 1);

const isRowUnlocked = (chief: Playthrough, kind: LadderKind, row: LadderRow) =>
  kind === "gear"
    ? isGearTierUnlocked(chief, row.tier ?? "Common")
    : isCharmLevelUnlocked(chief, row.level ?? 1);

/** The position of the last row the server age unlocks, or -1 when no row is unlocked. */
export const unlockedLimitOf = (chief: Playthrough, kind: LadderKind) =>
  ladderRows(kind).findLastIndex((row) => isRowUnlocked(chief, kind, row));

export const unlockedLimitStop = (chief: Playthrough, kind: LadderKind) => {
  const limit = unlockedLimitOf(chief, kind);
  return limit < 0 ? NONE_STOP : ladderRows(kind)[limit].id;
};

export const ladderStops = (kind: LadderKind, chief: Playthrough) => {
  const t = translator("chiefGear");
  const limit = unlockedLimitOf(chief, kind);
  return [
    { value: NONE_STOP, label: t("none") },
    ...ladderRows(kind).map((row, position) => ({
      value: row.id,
      label:
        position > limit
          ? t("lock.stop", {
              name: row.name,
              day: formatNumber(rowUnlockDay(kind, row)),
            })
          : row.name,
    })),
  ];
};

export interface LockedLevel {
  id: string;
  name: string;
  requirement: string;
}

const lockedLevelOf = (
  chief: Playthrough,
  kind: LadderKind,
  id: string,
): LockedLevel => {
  const row = ladderRows(kind)[positionOf(kind, id)];
  return {
    id,
    name: row.name,
    requirement: unlockText(chief, rowUnlockDay(kind, row)),
  };
};

/** One line for each server day that locks rows, naming the first locked row of that day. */
export const lockRequirementsOf = (chief: Playthrough, kind: LadderKind) => {
  const t = translator("chiefGear");
  const rows = ladderRows(kind);
  const limit = unlockedLimitOf(chief, kind);
  const days = new Set<number>();
  return rows.slice(limit + 1).flatMap((row) => {
    const day = rowUnlockDay(kind, row);
    if (days.has(day)) return [];
    days.add(day);
    return [
      t("lock.group", {
        name: row.name,
        requirement: unlockText(chief, day),
      }),
    ];
  });
};

/**
 * The place of a level in the ordered rows. A piece with no level yet sits at -1.
 */
export const positionOf = (kind: LadderKind, id: string | null | undefined) =>
  id ? ladderRows(kind).findIndex((row) => row.id === id) : -1;

const knownId = (kind: LadderKind, id: string | null | undefined) =>
  positionOf(kind, id) >= 0 ? (id as string) : null;

export interface LadderItem {
  key: string;
  kind: LadderKind;
  slotId: string;
  label: string;
  troopType: string;
  /** The current level, null when the piece has none or its saved level is locked by server age. */
  current: string | null;
  /** The goal above the current level, null when it is locked by server age. */
  goal: string | null;
  /** The position of the last row the server age unlocks. */
  limit: number;
  lockedCurrent: LockedLevel | null;
  lockedGoal: LockedLevel | null;
}

const effectiveGoal = (
  kind: LadderKind,
  current: string | null,
  goal: string | null | undefined,
) => {
  const known = knownId(kind, goal);
  return known !== null && positionOf(kind, known) > positionOf(kind, current)
    ? known
    : null;
};

export const CHARMS_PER_PIECE = 3;

const ladderStateOf = (
  chief: Playthrough,
  kind: LadderKind,
  savedCurrent: string | null | undefined,
  savedGoal: string | null | undefined,
) => {
  const limit = unlockedLimitOf(chief, kind);
  const saved = knownId(kind, savedCurrent);
  const goal = effectiveGoal(kind, saved, savedGoal);
  const currentLocked = saved !== null && positionOf(kind, saved) > limit;
  const goalLocked = goal !== null && positionOf(kind, goal) > limit;
  return {
    limit,
    current: currentLocked ? null : saved,
    goal: currentLocked || goalLocked ? null : goal,
    lockedCurrent: currentLocked ? lockedLevelOf(chief, kind, saved) : null,
    lockedGoal:
      goal !== null && (currentLocked || goalLocked)
        ? lockedLevelOf(chief, kind, goal)
        : null,
  };
};

export const gearItems = (chief: Playthrough): LadderItem[] =>
  chiefGearSlotList.map((slot) => ({
    key: slot.id,
    kind: "gear",
    slotId: slot.id,
    label: slot.name,
    troopType: slot.troopType,
    ...ladderStateOf(
      chief,
      "gear",
      chief.chiefGear?.[slot.id]?.current,
      chief.chiefGearPlan?.goals?.[slot.id],
    ),
  }));

export const charmItems = (chief: Playthrough): LadderItem[] =>
  chiefGearSlotList.flatMap((slot) =>
    Array.from({ length: CHARMS_PER_PIECE }, (_, index) => ({
      key: `${slot.id}:${index}`,
      kind: "charm" as const,
      slotId: slot.id,
      label: translator("chiefGear")("charmLabel", {
        number: formatNumber(index + 1),
      }),
      troopType: slot.troopType,
      ...ladderStateOf(
        chief,
        "charm",
        chief.chiefCharms?.[slot.id]?.[index]?.current,
        chief.chiefCharmsPlan?.goals?.[slot.id]?.[index],
      ),
    })),
  );

export const itemsOf = (kind: LadderKind, chief: Playthrough) =>
  kind === "gear" ? gearItems(chief) : charmItems(chief);

export const withGearLevel = (
  chief: Playthrough,
  slotId: string,
  current: string | null,
): Playthrough => ({
  ...chief,
  chiefGear: { ...chief.chiefGear, [slotId]: { current } },
});

export const withCharmLevel = (
  chief: Playthrough,
  slotId: string,
  index: number,
  current: string | null,
): Playthrough => {
  const charms = Array.from(
    { length: CHARMS_PER_PIECE },
    (_, position) => chief.chiefCharms?.[slotId]?.[position] ?? {},
  );
  charms[index] = { current };
  return { ...chief, chiefCharms: { ...chief.chiefCharms, [slotId]: charms } };
};

export const withItemLevel = (
  chief: Playthrough,
  item: LadderItem,
  current: string | null,
) =>
  item.kind === "gear"
    ? withGearLevel(chief, item.slotId, current)
    : withCharmLevel(
        chief,
        item.slotId,
        Number(item.key.split(":")[1]),
        current,
      );

export type PlanGoalMap = Record<string, string | null>;

export const initialGoalMap = (items: LadderItem[]): PlanGoalMap =>
  Object.fromEntries(
    items.map((item) => [
      item.key,
      item.lockedGoal?.id ?? item.goal ?? item.current,
    ]),
  );

export const withSavedGoals = (
  chief: Playthrough,
  kind: LadderKind,
  goals: PlanGoalMap,
  savedAt: string,
): Playthrough => {
  const items = itemsOf(kind, chief);
  if (kind === "gear") {
    return {
      ...chief,
      chiefGearPlan: {
        goals: Object.fromEntries(
          items.flatMap((item) => {
            const goal = goals[item.key];
            return goal ? [[item.slotId, goal] as const] : [];
          }),
        ),
        savedAt,
      },
    };
  }
  return {
    ...chief,
    chiefCharmsPlan: {
      goals: Object.fromEntries(
        chiefGearSlotList.map((slot) => [
          slot.id,
          Array.from(
            { length: CHARMS_PER_PIECE },
            (_, index) => goals[`${slot.id}:${index}`] ?? null,
          ),
        ]),
      ),
      savedAt,
    },
  };
};

export const rowOf = (kind: LadderKind, id: string | null) =>
  id === null ? undefined : ladderRows(kind)[positionOf(kind, id)];

export const levelLabel = (kind: LadderKind, id: string | null) =>
  rowOf(kind, id)?.name ?? translator("chiefGear")("none");

export const stepsToGoal = (item: LadderItem) =>
  item.goal === null
    ? 0
    : positionOf(item.kind, item.goal) - positionOf(item.kind, item.current);

export const progressOf = (item: LadderItem) =>
  positionOf(item.kind, item.current) + 1;

const sumOver = (
  items: LadderItem[],
  pick: (row: LadderRow | undefined) => number,
) =>
  items.reduce(
    (total, item) => total + pick(rowOf(item.kind, item.current)),
    0,
  );

/**
 * The score counted at the current levels is the sum of the score of every row up to the current
 * one. The power counted is the total power at the current row.
 */
export const scoreNow = (items: LadderItem[]) =>
  items.reduce((total, item) => {
    const position = positionOf(item.kind, item.current);
    return (
      total +
      ladderRows(item.kind)
        .slice(0, position + 1)
        .reduce((sum, row) => sum + row.score, 0)
    );
  }, 0);

export const powerNow = (items: LadderItem[]) =>
  sumOver(items, (row) => row?.powerTotal ?? 0);

export interface MaterialAmount {
  itemId: string;
  amount: number;
}

export interface LadderResult {
  steps: number;
  materials: MaterialAmount[];
  score: number;
  power: number;
  eventPoints: UpgradeResult["eventPoints"];
}

export const calculateRanges = (
  kind: LadderKind,
  ranges: { from: string | null; to: string }[],
): LadderResult =>
  kind === "gear" ? calculateChiefGear(ranges) : calculateChiefCharm(ranges);

export const rangeOf = (item: LadderItem) =>
  item.goal === null ? null : { from: item.current, to: item.goal };

export interface PlanItemResult {
  item: LadderItem;
  result: LadderResult;
}

export const runItemPlan = (
  items: LadderItem[],
  goals: PlanGoalMap,
): { total: LadderResult; byItem: PlanItemResult[] } => {
  const planned = items.flatMap((item) => {
    const goal = goals[item.key];
    return goal &&
      item.lockedCurrent === null &&
      positionOf(item.kind, goal) > positionOf(item.kind, item.current) &&
      positionOf(item.kind, goal) <= item.limit
      ? [{ ...item, goal }]
      : [];
  });
  const kind = items[0]?.kind ?? "gear";
  const total = calculateRanges(
    kind,
    planned.map((item) => ({ from: item.current, to: item.goal as string })),
  );
  const byItem = planned.map((item) => ({
    item,
    result: calculateRanges(kind, [
      { from: item.current, to: item.goal as string },
    ]),
  }));
  return { total, byItem };
};

export interface LadderSummary {
  scoreNow: number;
  powerNow: number;
  steps: number;
  scoreToGain: number;
  materials: MaterialAmount[];
  powerGain: number;
}

export const summarizeLadder = (items: LadderItem[]): LadderSummary => {
  const ranges = items.flatMap((item) => {
    const range = rangeOf(item);
    return range ? [range] : [];
  });
  const kind = items[0]?.kind ?? "gear";
  const total = calculateRanges(kind, ranges);
  return {
    scoreNow: scoreNow(items),
    powerNow: powerNow(items),
    steps: total.steps,
    scoreToGain: total.score,
    materials: total.materials,
    powerGain: total.power,
  };
};

export const ladderChecks = (
  materials: MaterialAmount[],
  chief: Playthrough,
): StockCheck[] =>
  materials.map(({ itemId, amount }) => ({
    id: itemId,
    name: findItem(itemId)?.name ?? itemId,
    available: ownedCount(chief, itemId),
    needed: amount,
  }));

export interface SetBonusView {
  pieces: 3 | 6;
  stat: string;
  percent: number;
  tierName: string | null;
}

/**
 * The set bonuses that the worn pieces unlock. A piece with no level yet does not count. The
 * package gives the percent of the tier and 0 when a bonus is not active.
 */
export const setBonusesOf = (chief: Playthrough): SetBonusView[] => {
  const worn = gearItems(chief).flatMap((item) =>
    item.current ? [item.current] : [],
  );
  const { threePiece, sixPiece } = chiefGearSetBonus(worn);
  return [threePiece, sixPiece].map((bonus) => ({
    pieces: bonus.pieces as 3 | 6,
    stat: bonus.stat,
    percent: bonus.percent,
    tierName: bonus.tierId ? setBonusTierName(bonus.tierId) : null,
  }));
};
