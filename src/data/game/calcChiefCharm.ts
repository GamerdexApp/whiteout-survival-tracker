import {
  BUFF_CHARMS_PER_GEAR_SLOT,
  calculateChiefCharm,
  chiefCharm,
  chiefCharmImage,
  chiefCharmSlots,
  chiefGearSlots,
  events,
} from "whiteout-survival-data";
import type {
  ChiefCharmLevel,
  ChiefGearSlot,
  UpgradeEventPoints,
  UpgradeRange,
  UpgradeResult,
} from "whiteout-survival-data";

export type {
  ChiefCharmLevel,
  ChiefGearSlot,
  UpgradeEventPoints,
  UpgradeRange,
  UpgradeResult,
};

export { calculateChiefCharm };

export const CHARMS_PER_GEAR_PIECE = BUFF_CHARMS_PER_GEAR_SLOT;

export const charmLevelList: ChiefCharmLevel[] = chiefCharm().get();

export const gearPieceList: ChiefGearSlot[] = chiefGearSlots().get();

const charmSlotList = chiefCharmSlots().get();

/** The charm picture of a gear piece follows the troop type of that piece. */
export const charmImageOf = (piece: ChiefGearSlot, level: number) => {
  const charmSlot = charmSlotList.find(
    (slot) => slot.troopType === piece.troopType,
  );
  return charmSlot ? chiefCharmImage(charmSlot, level) : undefined;
};

const EVENT_ID_BY_POINTS_KEY: Record<keyof UpgradeEventPoints, string> = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
  hallOfChief: "hall-of-chief",
};

export const charmEventList = (
  Object.keys(EVENT_ID_BY_POINTS_KEY) as (keyof UpgradeEventPoints)[]
).map((key) => ({
  key,
  name: events().find(EVENT_ID_BY_POINTS_KEY[key])?.name ?? key,
}));
