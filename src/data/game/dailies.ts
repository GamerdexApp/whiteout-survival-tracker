import {
  dailies,
  DAILY_MISSION_ACTIVENESS_ITEM_ID,
  dailyMissionActiveness,
  dailyMissionActivenessThrough,
  dailyMissionRewardLevels,
  dailyMissions,
  items,
} from "whiteout-survival-data";
import type {
  DailyMission,
  DailyMissionLevel,
  DailyMissionRewardLevel,
} from "whiteout-survival-data";

export type { DailyMission, DailyMissionLevel, DailyMissionRewardLevel };

export const dailyMissionList: DailyMission[] = dailyMissions().get();

export const rewardLevels: DailyMissionRewardLevel[] =
  dailyMissionRewardLevels();

export const TOP_REWARD_ACTIVENESS =
  rewardLevels[rewardLevels.length - 1].activeness;

export const MAX_MISSION_LEVEL = 3;

export const missionActiveness = (level: DailyMissionLevel) =>
  dailyMissionActiveness(level);

export const missionActivenessThrough = (
  mission: DailyMission,
  level: number,
) => dailyMissionActivenessThrough(mission, level);

export const routineTasks: { id: string; name: string }[] = dailies()
  .get()
  .map((task) => ({ id: task.id, name: task.name }));

export const itemName = (itemId: string) =>
  items().find(itemId)?.name ?? itemId;

export const isActivenessItem = (itemId: string) =>
  itemId === DAILY_MISSION_ACTIVENESS_ITEM_ID;

export const ALL_LEVELS_ACTIVENESS = dailyMissionList.reduce(
  (sum, mission) =>
    sum + dailyMissionActivenessThrough(mission, mission.levels.length),
  0,
);

export const LEVEL_ONE_ACTIVENESS = dailyMissionList.reduce(
  (sum, mission) => sum + dailyMissionActivenessThrough(mission, 1),
  0,
);
