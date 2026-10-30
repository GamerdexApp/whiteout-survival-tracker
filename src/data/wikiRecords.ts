import { calculators } from "./calculators";
import { allBuildings } from "./game/buildings";
import { charmSlotList } from "./game/chiefGear";
import { allExperts } from "./game/experts";
import { allGameEvents } from "./game/gameEvents";
import { allHeroes } from "./game/heroes";
import { allPets } from "./game/pets";
import { type WikiPageId, wikiPages } from "./wiki";

/** The reference pages that show a page for one record, with the ids of those records. The other pages show a note for any id. */
const recordIdsByPage: Partial<Record<WikiPageId, string[]>> = {
  buildings: allBuildings.map((building) => building.id),
  chiefCharms: charmSlotList.map((slot) => slot.id),
  experts: allExperts.map((expert) => expert.id),
  heroes: allHeroes.map((hero) => hero.id),
  events: allGameEvents().map((event) => event.id),
  pets: allPets.map((pet) => pet.id),
  calculator: calculators.map((calculator) => calculator.slug),
};

/** Every address of a record page, for the static export. */
export const wikiRecordParams = () =>
  wikiPages.flatMap((page) => (recordIdsByPage[page.id] ?? []).map((record) => ({ page: page.slug, record })));
