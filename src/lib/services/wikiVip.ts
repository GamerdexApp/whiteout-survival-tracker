import { vipLevels } from "@/data/game/vip";
import type { VipBonus, VipLevel } from "@/data/game/vip";

/** One row of the ladder for each stat the top level lists, in the package order. */
export const vipStatRows: { statKey: string; stat: string }[] = vipLevels[
  vipLevels.length - 1
].bonuses.map(({ statKey, stat }) => ({ statKey, stat }));

export const vipBonusAt = (
  level: VipLevel,
  statKey: string,
): VipBonus | undefined =>
  level.bonuses.find((bonus) => bonus.statKey === statKey);

/** The XP needed to reach a level from the start: the sum of the levels up to and including it. */
export const vipRunningXp = (level: VipLevel) =>
  vipLevels
    .filter((other) => other.level <= level.level)
    .reduce((sum, other) => sum + other.xpRequired, 0);

export const vipTotalXp = vipRunningXp(vipLevels[vipLevels.length - 1]);
