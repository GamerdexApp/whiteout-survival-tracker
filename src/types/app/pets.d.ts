/**
 * `refine` holds the six refinement values in percent, in this order: Infantry Lethality,
 * Infantry Health, Lancer Lethality, Lancer Health, Marksman Lethality, Marksman Health. Each
 * value runs from 0 to the maximum refinement of the pet.
 */
export interface PetState {
  unlocked?: boolean;
  level?: number;
  advanced?: boolean;
  refine?: number[];
}

export interface PetGoalState {
  level: number;
  advanceAtGoal: boolean;
}

export interface PetsPlanState {
  goals: Record<string, PetGoalState>;
  savedAt: string;
}
