import type { CoreEventId } from "@/types/app";

export const CHIEF_NAME_MAX_LENGTH = 40;
export const CHIEF_NOTES_MAX_LENGTH = 500;
export const STATE_NUMBER_MAX = 99999;
export const MAX_HERO_GENERATION = 17;
export const DEFAULT_HERO_GENERATION = 1;

export const coreEvents: { id: CoreEventId; label: string }[] = [
  { id: "svs", label: "SvS" },
  { id: "showdown", label: "Alliance Showdown" },
  { id: "king", label: "King of Icefield" },
  { id: "hall", label: "Hall of Chief" },
];

export const allCoreEventIds = coreEvents.map((event) => event.id);
