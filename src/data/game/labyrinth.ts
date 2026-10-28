import { LABYRINTH_GLOWSTONE_PER_STAGE } from "whiteout-survival-data";
import type {
  GameEvent,
  GameEventReward,
  GameEventShopOffer,
  GameEventTier,
} from "whiteout-survival-data";
import { findExpert } from "./experts";
import { gameEventById } from "./gameEvents";

export { LABYRINTH_GLOWSTONE_PER_STAGE };
export type { GameEventReward, GameEventShopOffer, GameEventTier };

export const JUSTUS_ID = "justus";

export interface LabyrinthZone {
  id: string;
  name: string;
  days: string[];
  stages: number;
  statSources: string;
  troops?: string;
  unlock?: string;
  note?: string;
}

export const LABYRINTH_EVENT_ID = "the-labyrinth";

const labyrinth = gameEventById(LABYRINTH_EVENT_ID) as GameEvent;

const zoneIdOf = (name: string) => name.toLowerCase().replaceAll(" ", "-");

export const labyrinthZones: LabyrinthZone[] = (labyrinth.zones ?? []).flatMap(
  ({ stages, name, ...zone }) =>
    stages === undefined ? [] : [{ ...zone, id: zoneIdOf(name), name, stages }],
);

const HERO_FORMATION_ZONE_IDS = ["land-of-heroes", "gaia-heart"];

export const usesHeroFormations = (zoneId: string) =>
  HERO_FORMATION_ZONE_IDS.includes(zoneId);

export const labyrinthMilestones: GameEventTier[] = labyrinth.tiers ?? [];

export const labyrinthRewards: GameEventReward[] = labyrinth.rewards ?? [];

export const labyrinthShop: GameEventShopOffer[] = labyrinth.shop ?? [];

export const LABYRINTH_IMAGE = labyrinth.img;

const justus = findExpert(JUSTUS_ID)!;
const justusSkill = justus.skills[0];

export const JUSTUS_NAME = justus.name;

export const JUSTUS_GLOWSTONE_SKILL = {
  name: justusSkill.name,
  bonusPercentByLevel: justusSkill.progressions[0].values,
};
