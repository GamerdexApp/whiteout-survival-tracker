import { BUFF_VIP_MAX_LEVEL, vip } from "whiteout-survival-data";
import type { VipBonus, VipLevel } from "whiteout-survival-data";

export type { VipBonus, VipLevel };

export const vipLevels: VipLevel[] = vip().get();

export const MAX_VIP_LEVEL = BUFF_VIP_MAX_LEVEL;

export const vipLevelAtXp = (totalXp: number) => vip().atXp(totalXp).first();
