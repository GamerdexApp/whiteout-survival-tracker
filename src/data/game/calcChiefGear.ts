import {
  calculateChiefGear,
  chiefGear,
  chiefGearImage,
  chiefGearSlots,
  events,
} from "whiteout-survival-data";
import type {
  ChiefGearLevel,
  ChiefGearSlot,
  GameEvent,
  UpgradeEventPoints,
  UpgradeRange,
  UpgradeResult,
} from "whiteout-survival-data";

export type {
  ChiefGearLevel,
  ChiefGearSlot,
  UpgradeEventPoints,
  UpgradeRange,
  UpgradeResult,
};

export { calculateChiefGear, chiefGearImage };

export const chiefGearLevelList: ChiefGearLevel[] = chiefGear().get();

export const chiefGearPieceList: ChiefGearSlot[] = chiefGearSlots().get();

export type ChiefGearEventKey = keyof UpgradeEventPoints;

const EVENT_ID_OF_KEY: Record<ChiefGearEventKey, string> = {
  svs: "svs-state-of-power",
  allianceShowdown: "alliance-showdown",
  kingOfIcefield: "king-of-icefield",
  hallOfChief: "hall-of-chief",
};

export const chiefGearEventList = (
  Object.keys(EVENT_ID_OF_KEY) as ChiefGearEventKey[]
).map((key) => ({
  key,
  name: (events().find(EVENT_ID_OF_KEY[key]) as GameEvent).name,
}));
