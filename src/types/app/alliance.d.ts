export interface AllianceState {
  bannerLevel?: number;
}

export interface AllianceTechNodeState {
  level?: number;
}

export interface AllianceFacilityState {
  /** The levels of the facility that the alliance owns. One alliance owns at most one of each. */
  ownedLevels?: number[];
}
