import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { calculators } from "@/data/calculators";
import { wikiPages } from "@/data/wiki";
import { allBuildings } from "./buildings";
import { CORE_EVENT_IDS } from "./coreEvents";
import { allHeroes } from "./heroes";
import { allResearch } from "./research";

export const landingCounts = {
  buildings: allBuildings.length,
  heroes: allHeroes.length,
  research: allResearch.length,
  coreEvents: CORE_EVENT_IDS.length,
  wiki: wikiPages.length,
  calculators: calculators.length,
  languages: SUPPORTED_LOCALES.length,
};
