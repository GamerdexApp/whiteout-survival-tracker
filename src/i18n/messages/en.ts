import alliance from "./en/alliance.json";
import bonuses from "./en/bonuses.json";
import buildings from "./en/buildings.json";
import chiefGear from "./en/chiefGear.json";
import chiefs from "./en/chiefs.json";
import common from "./en/common.json";
import coreEvents from "./en/coreEvents.json";
import dailies from "./en/dailies.json";
import daybreak from "./en/daybreak.json";
import eventExport from "./en/eventExport.json";
import eventLog from "./en/eventLog.json";
import events from "./en/events.json";
import experts from "./en/experts.json";
import facilities from "./en/facilities.json";
import heroes from "./en/heroes.json";
import heroGear from "./en/heroGear.json";
import history from "./en/history.json";
import pets from "./en/pets.json";
import queues from "./en/queues.json";
import research from "./en/research.json";
import resources from "./en/resources.json";
import settings from "./en/settings.json";
import shell from "./en/shell.json";
import tech from "./en/tech.json";
import troops from "./en/troops.json";
import tundraAlbum from "./en/tundraAlbum.json";
import ui from "./en/ui.json";

/**
 * The English catalog is the source of truth for the key names and their types. One file for each
 * area keeps a change to one page in one file. A new language copies this shape.
 */
const en = {
  common,
  ui,
  shell,
  chiefs,
  settings,
  buildings,
  resources,
  bonuses,
  research,
  queues,
  heroes,
  heroGear,
  chiefGear,
  troops,
  experts,
  pets,
  alliance,
  tech,
  facilities,
  coreEvents,
  eventLog,
  history,
  eventExport,
  events,
  dailies,
  daybreak,
  tundraAlbum,
};

export default en;
