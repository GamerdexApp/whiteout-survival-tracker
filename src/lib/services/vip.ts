import type { Playthrough } from "@/types/app";
import { MAX_VIP_LEVEL, vipLevelAtXp, vipLevels } from "@/data/game/vip";
import type { VipBonus } from "@/data/game/vip";

const cumulativeXp = vipLevels.reduce<number[]>(
  (totals, level) => [...totals, (totals.at(-1) ?? 0) + level.xpRequired],
  [],
);

export const MAX_VIP_XP = cumulativeXp[MAX_VIP_LEVEL - 1];

export const withVipXp = (
  chief: Playthrough,
  totalXp: number,
): Playthrough => ({
  ...chief,
  vip: {
    ...chief.vip,
    totalXp: Math.min(MAX_VIP_XP, Math.max(0, Math.trunc(totalXp))),
  },
});

export const totalXpOf = (chief: Playthrough) => chief.vip?.totalXp;

export const lowestXpOfLevel = (level: number) => cumulativeXp[level - 1];

export const vipLevelOf = (chief: Playthrough) => {
  const totalXp = totalXpOf(chief);
  return totalXp === undefined ? undefined : vipLevelAtXp(totalXp)?.level;
};

export const withVipLevel = (chief: Playthrough, level: number): Playthrough =>
  withVipXp(
    chief,
    lowestXpOfLevel(Math.min(MAX_VIP_LEVEL, Math.max(1, level))),
  );

export interface VipProgress {
  levelStartXp: number;
  nextLevelXp: number;
  xpToNext: number;
  fraction: number;
}

/** Null at the maximum level. */
export const progressOf = (
  totalXp: number,
  level: number,
): VipProgress | null => {
  if (level >= MAX_VIP_LEVEL) return null;
  const levelStartXp = lowestXpOfLevel(level);
  const nextLevelXp = lowestXpOfLevel(level + 1);
  return {
    levelStartXp,
    nextLevelXp,
    xpToNext: nextLevelXp - totalXp,
    fraction: (totalXp - levelStartXp) / (nextLevelXp - levelStartXp),
  };
};

export const bonusesOfLevel = (level: number): VipBonus[] =>
  vipLevels[level - 1].bonuses;

export interface BonusChange {
  bonus: VipBonus;
  was: VipBonus | null;
}

const previousBonusOf = (bonus: VipBonus, earlier: VipBonus[]) =>
  earlier.find((candidate) => candidate.statKey === bonus.statKey) ?? null;

export const bonusChanges = (level: number): BonusChange[] => {
  const earlier = level > 1 ? bonusesOfLevel(level - 1) : [];
  return bonusesOfLevel(level).map((bonus) => ({
    bonus,
    was: previousBonusOf(bonus, earlier),
  }));
};

export const isNewOrHigher = (change: BonusChange) =>
  change.was === null || change.bonus.amount > change.was.amount;

export type VipRowState = "reached" | "current" | "ahead" | "unknown";

export interface VipRow {
  level: number;
  /** Null for VIP 1, which the package stores as 0 because the source shows a dash. */
  xpFromLast: number | null;
  totalXp: number;
  newOrHigher: VipBonus[];
  state: VipRowState;
}

const stateOf = (
  rowLevel: number,
  current: number | undefined,
): VipRowState => {
  if (current === undefined) return "unknown";
  if (rowLevel === current) return "current";
  return rowLevel < current ? "reached" : "ahead";
};

export const vipRows = (chief: Playthrough): VipRow[] => {
  const current = vipLevelOf(chief);
  return vipLevels.map((entry) => ({
    level: entry.level,
    xpFromLast: entry.level === 1 ? null : entry.xpRequired,
    totalXp: lowestXpOfLevel(entry.level),
    newOrHigher: bonusChanges(entry.level)
      .filter(isNewOrHigher)
      .map((change) => change.bonus),
    state: stateOf(entry.level, current),
  }));
};

/** The input of `BuffProfile.vipLevel`. Empty when the chief has no saved VIP XP. */
export const vipBuffInputs = (chief: Playthrough): { vipLevel?: number } => {
  const level = vipLevelOf(chief);
  return level === undefined || level < 1 ? {} : { vipLevel: level };
};
