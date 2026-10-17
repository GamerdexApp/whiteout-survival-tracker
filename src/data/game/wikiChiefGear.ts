import {
  CHIEF_GEAR_SET_BONUS,
  chiefGearSetBonuses,
} from "whiteout-survival-data";
import type { ChiefGearSetBonusTier } from "whiteout-survival-data";

export type {
  ChiefCharmLevel,
  ChiefCharmSlot,
  ChiefGearLevel,
  ChiefGearSlot,
  ItemConversion,
} from "whiteout-survival-data";

export type { ChiefGearSetBonusTier };

export const setBonusRule = CHIEF_GEAR_SET_BONUS;

export const setBonusTiers: ChiefGearSetBonusTier[] =
  chiefGearSetBonuses().get();
