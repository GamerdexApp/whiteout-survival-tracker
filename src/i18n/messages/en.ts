import bonuses from "./en/bonuses.json";
import buildings from "./en/buildings.json";
import chiefGear from "./en/chiefGear.json";
import chiefs from "./en/chiefs.json";
import common from "./en/common.json";
import heroes from "./en/heroes.json";
import heroGear from "./en/heroGear.json";
import queues from "./en/queues.json";
import research from "./en/research.json";
import resources from "./en/resources.json";
import settings from "./en/settings.json";
import shell from "./en/shell.json";
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
};

export default en;
