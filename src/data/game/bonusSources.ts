/**
 * The sources that no page stores. They add nothing, and the Bonuses page says so instead of
 * showing a total that looks complete. Each id is a key of `bonuses.sourceTypes`.
 */
export const unstoredSourceIds = [
  "castleAppointment",
  "chiefOrder",
  "presidentSkill",
] as const;
