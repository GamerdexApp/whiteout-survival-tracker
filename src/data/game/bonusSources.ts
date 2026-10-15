import type { BuffSourceType } from "whiteout-survival-data";

/**
 * One name for each kind of source. The package splits research in two and the island in two, but
 * the page shows one row for each.
 */
export const sourceTypeNames: Record<BuffSourceType, string> = {
  account: "Account",
  hero: "Heroes",
  expert: "Experts",
  research: "Research",
  allianceTech: "Alliance Tech",
  allianceFacility: "Alliance Facilities",
  alliancePrestige: "Alliance Prestige Buildings",
  vip: "VIP",
  building: "Buildings",
  skin: "Skins",
  tundraAlbum: "Tundra Album",
  collection: "Collection",
  decoration: "My Island",
  treeOfLife: "My Island",
  castleAppointment: "Castle position",
  pet: "Pets",
  chiefGear: "Chief Gear",
  chiefGearSet: "Chief Gear set bonus",
  chiefCharm: "Chief Charms",
  chiefOrder: "Chief Orders",
  presidentSkill: "President skills",
};

/**
 * The sources that no page stores yet. They add nothing until their page exists, and the page says
 * so instead of showing a total that looks complete.
 */
export const pendingSources: { name: string; page: string }[] = [
  { name: "Heroes", page: "Heroes" },
  { name: "Experts", page: "Experts" },
  { name: "Research", page: "Research" },
  { name: "Alliance Tech", page: "Tech" },
  { name: "Alliance Facilities", page: "Facilities" },
  { name: "Alliance Prestige Buildings", page: "Alliance" },
  { name: "VIP", page: "VIP" },
  { name: "Skins", page: "Skins" },
  { name: "Tundra Album", page: "Tundra Album" },
  { name: "My Island", page: "Daybreak Island" },
  { name: "Pets", page: "Pets" },
  { name: "Chief Gear, set bonus and Charms", page: "Chief Gear" },
];

export const unstoredSources = [
  "Castle position",
  "Chief Orders",
  "President skills",
  "the March Queue pack",
];
