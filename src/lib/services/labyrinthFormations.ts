import type {
  LabyrinthHeroFormation,
  LabyrinthTroopSplit,
  LabyrinthTroopType,
  Playthrough,
} from "@/types/app";
import { labyrinthZones, usesHeroFormations } from "@/data/game/labyrinth";
import { heroPowerParts } from "./heroes";
import type { HeroView } from "./heroes";
import { gearSetsOf, setPower } from "./heroGear";

export const TROOP_TYPES: LabyrinthTroopType[] = [
  "infantry",
  "lancer",
  "marksman",
];

export const HERO_FORMATION_COUNT = 3;

export const TROOP_SPLIT_TOTAL = 100;

export type HeroPicks = Record<LabyrinthTroopType, string | null>;

export interface HeroFormationDraft {
  heroes: HeroPicks;
  troops: LabyrinthTroopSplit;
}

/** Land of Heroes and Gaia Heart hold hero formations. The other zones hold one troop split. */
export type ZoneFormationDraft =
  | { kind: "heroes"; formations: HeroFormationDraft[] }
  | { kind: "troops"; troops: LabyrinthTroopSplit };

/** The formation of each zone, by zone id. */
export type FormationsDraft = Record<string, ZoneFormationDraft>;

const splitOf = (saved: LabyrinthTroopSplit | undefined): LabyrinthTroopSplit =>
  Object.fromEntries(
    TROOP_TYPES.map((type) => [
      type,
      Math.min(TROOP_SPLIT_TOTAL, Math.max(0, Math.floor(saved?.[type] ?? 0))),
    ]),
  ) as LabyrinthTroopSplit;

const picksOf = (saved: LabyrinthHeroFormation | undefined): HeroPicks => ({
  infantry: saved?.heroes?.infantry ?? null,
  lancer: saved?.heroes?.lancer ?? null,
  marksman: saved?.heroes?.marksman ?? null,
});

const zoneDraftOf = (
  chief: Playthrough,
  zoneId: string,
): ZoneFormationDraft => {
  const saved = chief.labyrinth?.formations?.[zoneId];
  if (!usesHeroFormations(zoneId)) {
    return { kind: "troops", troops: splitOf(saved?.troops) };
  }
  return {
    kind: "heroes",
    formations: Array.from({ length: HERO_FORMATION_COUNT }, (_, index) => {
      const formation = saved?.heroFormations?.[index];
      return { heroes: picksOf(formation), troops: splitOf(formation?.troops) };
    }),
  };
};

export const formationsDraftOf = (chief: Playthrough): FormationsDraft =>
  Object.fromEntries(
    labyrinthZones.map((zone) => [zone.id, zoneDraftOf(chief, zone.id)]),
  );

export const splitTotalOf = (split: LabyrinthTroopSplit) =>
  TROOP_TYPES.reduce((total, type) => total + split[type], 0);

/** A split of 0, 0 and 0 is a formation that is not set. Any other split must total 100. */
export const isSplitValid = (split: LabyrinthTroopSplit) => {
  const total = splitTotalOf(split);
  return total === 0 || total === TROOP_SPLIT_TOTAL;
};

const isZoneDraftValid = (draft: ZoneFormationDraft) =>
  draft.kind === "heroes"
    ? draft.formations.every((formation) => isSplitValid(formation.troops))
    : isSplitValid(draft.troops);

export const isDraftValid = (draft: FormationsDraft) =>
  Object.values(draft).every(isZoneDraftValid);

const heroIdsOf = (formation: HeroFormationDraft) =>
  TROOP_TYPES.flatMap((type) => formation.heroes[type] ?? []);

export type HeroPowerOf = (view: HeroView) => number | null;

/**
 * The power of a hero plus the power of its gear set. A hero wears one set, so when several sets
 * link to the same hero the strongest counts. Power stays unknown when the hero power is unknown.
 */
export const heroPowerWithGearOf = (chief: Playthrough): HeroPowerOf => {
  const gearPower = new Map<string, number>();
  gearSetsOf(chief).forEach((set) => {
    if (!set.heroId) return;
    gearPower.set(
      set.heroId,
      Math.max(gearPower.get(set.heroId) ?? 0, setPower(set)),
    );
  });
  return (view) => {
    const power = heroPowerParts(view).total;
    return power === null ? null : power + (gearPower.get(view.hero.id) ?? 0);
  };
};

const byPowerThenName =
  (powerOf: HeroPowerOf) => (a: HeroView, b: HeroView) => {
    const powerA = powerOf(a);
    const powerB = powerOf(b);
    if (powerA !== powerB) {
      if (powerA === null) return 1;
      if (powerB === null) return -1;
      return powerB - powerA;
    }
    return a.hero.name.localeCompare(b.hero.name, "en");
  };

/**
 * The owned heroes of one class that a formation may pick: those no other formation of the same
 * zone uses, strongest first. A hero with unknown power comes last. The hero the formation already
 * holds stays in the list, even when it is no longer owned.
 */
export const heroChoicesFor = (
  views: HeroView[],
  formations: HeroFormationDraft[],
  formationIndex: number,
  type: LabyrinthTroopType,
  powerOf: HeroPowerOf,
): HeroView[] => {
  const usedElsewhere = new Set(
    formations.flatMap((formation, index) =>
      index === formationIndex ? [] : heroIdsOf(formation),
    ),
  );
  const held = formations[formationIndex].heroes[type];
  return views
    .filter(
      ({ hero, owned }) =>
        hero.class.toLowerCase() === type &&
        (hero.id === held || (owned && !usedElsewhere.has(hero.id))),
    )
    .sort(byPowerThenName(powerOf));
};

const picksToSave = (picks: HeroPicks) =>
  Object.fromEntries(
    TROOP_TYPES.flatMap((type) => (picks[type] ? [[type, picks[type]]] : [])),
  );

const troopsToSave = (split: LabyrinthTroopSplit) =>
  splitTotalOf(split) > 0 ? split : undefined;

export const withFormations = (
  chief: Playthrough,
  draft: FormationsDraft,
): Playthrough => ({
  ...chief,
  labyrinth: {
    ...chief.labyrinth,
    formations: Object.fromEntries(
      Object.entries(draft).map(([zoneId, zone]) => [
        zoneId,
        zone.kind === "heroes"
          ? {
              heroFormations: zone.formations.map(({ heroes, troops }) => ({
                heroes: picksToSave(heroes),
                troops: troopsToSave(troops),
              })),
            }
          : { troops: troopsToSave(zone.troops) },
      ]),
    ),
  },
});
