/**
 * The affinity is 1 to 100. `skills` and `skillExp` hold the four skills in package order.
 * `affinityAvailable` is the affinity points held toward the next level, and `skillExp` is the
 * EXP held toward the next level of each skill. The relationship stage and the talent level are
 * never stored.
 */
export interface ExpertState {
  recruited?: boolean;
  affinity?: number;
  affinityAvailable?: number;
  advanced?: boolean;
  skills?: number[];
  skillExp?: number[];
}

/**
 * `advanced` is true when the plan pays for the advancement at the affinity goal. A value
 * at or below the current one is not a goal and is not stored.
 */
export interface ExpertGoalState {
  affinity?: number;
  advanced?: boolean;
  skills?: number[];
}

export interface ExpertsPlanState {
  goals: Record<string, ExpertGoalState>;
  savedAt: string;
}

/**
 * A learning session that adds Skill EXP to one skill of an expert. Only one session runs at a
 * time. `exp` is the EXP the session earns, saved so a change of the preset list cannot change a
 * running session.
 */
export interface LearningJobState {
  startedAt: string;
  endsAt: string;
  expertId: string;
  skillIndex: number;
  minutes: number;
  exp: number;
}
