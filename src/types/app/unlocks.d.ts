export type UnlockArea =
  | "pets"
  | "fireCrystal"
  | "experts"
  | "chiefGear"
  | "chiefCharms"
  | "warAcademy";

/**
 * The server day through which each area is unlocked, set by the chief. An area with no entry
 * follows the server age that comes from the server start date.
 */
export type UnlockOverrides = Partial<Record<UnlockArea, number>>;
