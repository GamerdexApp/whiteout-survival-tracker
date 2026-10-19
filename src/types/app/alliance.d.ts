export interface AllianceState {
  bannerLevel?: number;
  /** The tier name that the alliance holds of each prestige building, by building id. */
  prestige?: Record<string, string>;
}

export interface AllianceTechNodeState {
  level?: number;
}

export interface AllianceFacilityState {
  /** The levels of the facility that the alliance owns. One alliance owns at most one of each. */
  ownedLevels?: number[];
}
