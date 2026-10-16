export interface DaybreakDecorationState {
  owned?: boolean;
  /** For decorations with levels. */
  level?: number;
  /** For the Basic and Vegetation decorations that are owned several times. */
  count?: number;
}

export interface DaybreakState {
  lumberCamp?: number;
  treeOfLife?: number;
  decorations?: Record<string, DaybreakDecorationState>;
}
