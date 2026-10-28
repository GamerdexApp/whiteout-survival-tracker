/**
 * `stages` holds the stage each zone has reached, by zone id. The Justus skill level is not
 * here. It is read from the Experts page.
 * `formations` holds the formation of each zone, by zone id. Land of Heroes and Gaia Heart have
 * up to three hero formations. Position 1 is Formation 1. The other zones have one troop split.
 * A troop split is a whole percent for each troop type and totals 100.
 */
export interface LabyrinthState {
  stages?: Record<string, number>;
  formations?: Record<string, LabyrinthZoneFormation>;
}

export type LabyrinthTroopType = "infantry" | "lancer" | "marksman";

export type LabyrinthTroopSplit = Record<LabyrinthTroopType, number>;

export interface LabyrinthHeroFormation {
  heroes?: Partial<Record<LabyrinthTroopType, string>>;
  troops?: LabyrinthTroopSplit;
}

export interface LabyrinthZoneFormation {
  heroFormations?: LabyrinthHeroFormation[];
  troops?: LabyrinthTroopSplit;
}
