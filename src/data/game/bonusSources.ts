/**
 * The sources that no page stores yet. They add nothing until their page exists, and the page says
 * so instead of showing a total that looks complete. Each id is a key of `bonuses.sourceTypes`.
 */
export const pendingSourceIds = ["alliancePrestige"] as const;

export const unstoredSourceIds = [
  "castleAppointment",
  "chiefOrder",
  "presidentSkill",
] as const;
