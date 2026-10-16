import { serverTimeline } from "whiteout-survival-data";
import type { ServerTimelineMilestone } from "whiteout-survival-data";

export const timelineMilestones: ServerTimelineMilestone[] =
  serverTimeline().get();

/** The server day on which the timeline unlock with this key happens. 0 when the key is unknown. */
export const unlockDayOfKey = (key: string) =>
  timelineMilestones.find((milestone) =>
    milestone.unlocks.some((unlock) => unlock.key === key),
  )?.day ?? 0;
