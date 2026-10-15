import {
  chiefCharm,
  chiefCharmConverter,
  chiefCharmImage,
  chiefCharmSlots,
  chiefGear,
  chiefGearConverter,
  chiefGearImage,
  chiefGearSetBonus,
  chiefGearSetBonuses,
  chiefGearSlots,
} from "whiteout-survival-data";
import type { ChiefCharmLevel, ChiefGearLevel } from "whiteout-survival-data";

export const gearLevels: ChiefGearLevel[] = chiefGear().get();
export const charmLevels: ChiefCharmLevel[] = chiefCharm().get();
export const chiefGearSlotList = chiefGearSlots().get();
export const charmSlotList = chiefCharmSlots().get();
export const gearConverter = chiefGearConverter().get();
export const charmConverter = chiefCharmConverter().get();

export { chiefCharmImage, chiefGearImage };

export const findCharmSlotByTroop = (troopType: string) =>
  charmSlotList.find((slot) => slot.troopType === troopType);

export const gearTiers = [
  ...new Set(gearLevels.map((level) => level.tier)),
].map((tier) => ({
  tier,
  rows: gearLevels.filter((level) => level.tier === tier).length,
}));

export { chiefGearSetBonus };

export const setBonusTierName = (tierId: string) =>
  chiefGearSetBonuses().find(tierId)?.name ?? tierId;
