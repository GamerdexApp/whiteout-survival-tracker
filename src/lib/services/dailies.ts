import { translator } from "@/i18n/formatter";
import type { DailiesState, DailyTaskState, Playthrough } from "@/types/app";
import {
  dailyMissionList,
  missionActivenessThrough,
  rewardLevels,
  routineTasks,
  TOP_REWARD_ACTIVENESS,
} from "@/data/game/dailies";

export const DEFAULT_RESET_TIME = "00:00";
export const STARTER_VERSION = 1;
export const RESET_STEP_MINUTES = 30;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const MINUTES_PER_DAY = 1_440;

export const STARTER_TASKS = [
  { id: "vipPoints", since: 1 },
  { id: "shopFreebies", since: 1 },
  { id: "explorationRewards", since: 1 },
  { id: "intelMissions", since: 1 },
  { id: "allianceTech", since: 1 },
  { id: "allianceChests", since: 1 },
  { id: "allianceHelp", since: 1 },
  { id: "arena", since: 1 },
  { id: "heroRecruit", since: 1 },
  { id: "daybreakRewards", since: 1 },
  { id: "healTroops", since: 1 },
  { id: "petAdventure", since: 1 },
] as const;

export const starterVersionOf = (id: StarterTaskId) =>
  STARTER_TASKS.find((task) => task.id === id)?.since ?? STARTER_VERSION;

export type StarterTaskId = (typeof STARTER_TASKS)[number]["id"];

export const RESET_TIME_OPTIONS: string[] = Array.from(
  { length: MINUTES_PER_DAY / RESET_STEP_MINUTES },
  (_, index) => formatClock(index * RESET_STEP_MINUTES),
);

function formatClock(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const resetMinutes = (resetTime: string) => {
  const [hours, minutes] = resetTime.split(":").map(Number);
  return hours * 60 + minutes;
};

const starterTaskId = (starterId: string) => `starter-${starterId}`;

const starterTask = (starterId: StarterTaskId): DailyTaskState => ({
  id: starterTaskId(starterId),
  label: translator("dailies")(`starter.${starterId}`),
  presetId: starterId,
});

export const defaultDailies = (): DailiesState => ({
  resetTimeUtc: DEFAULT_RESET_TIME,
  presetVersion: STARTER_VERSION,
  tasks: STARTER_TASKS.filter((task) => task.since <= STARTER_VERSION).map(
    (task) => starterTask(task.id),
  ),
  done: {},
});

export const readDailies = (chief: Playthrough): DailiesState =>
  chief.dailies ?? defaultDailies();

export const cycleDateAt = (nowMs: number, resetTime: string) => {
  const shifted = nowMs - resetMinutes(resetTime) * MINUTE_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS)
    .toISOString()
    .slice(0, 10);
};

export const nextResetAt = (nowMs: number, resetTime: string) => {
  const offset = resetMinutes(resetTime) * MINUTE_MS;
  const shifted = nowMs - offset;
  return (Math.floor(shifted / DAY_MS) + 1) * DAY_MS + offset;
};

export const secondsToNextReset = (nowMs: number, resetTime: string) =>
  Math.ceil((nextResetAt(nowMs, resetTime) - nowMs) / 1_000);

export const utcClock = (nowMs: number) =>
  formatClock(Math.floor((nowMs % DAY_MS) / MINUTE_MS));

export const missionLevelToday = (
  state: DailiesState,
  missionId: string,
  cycle: string,
) => {
  const saved = state.missions?.[missionId];
  return saved && saved.cycleDate === cycle ? saved.level : 0;
};

export const isTaskDone = (
  state: DailiesState,
  taskId: string,
  cycle: string,
) => state.done[taskId] === cycle;

export interface MissionView {
  id: string;
  name: string;
  level: number;
  knownLevels: number;
  levelTask: string;
  levelTarget: number;
  activenessNow: number;
  activenessMax: number;
  levelActiveness: number[];
  otherRewards: { itemId: string; amount: number }[];
}

const ACTIVENESS_ITEM = "activeness";

export const buildMissionViews = (
  state: DailiesState,
  cycle: string,
): MissionView[] =>
  dailyMissionList.map((mission) => {
    const level = Math.min(
      missionLevelToday(state, mission.id, cycle),
      mission.levels.length,
    );
    const shown = mission.levels[Math.max(level, 1) - 1];
    return {
      id: mission.id,
      name: mission.name,
      level,
      knownLevels: mission.levels.length,
      levelTask: shown.task,
      levelTarget: shown.target,
      activenessNow: missionActivenessThrough(mission, level),
      activenessMax: missionActivenessThrough(mission, mission.levels.length),
      levelActiveness: mission.levels.map((_, index) =>
        index === 0
          ? missionActivenessThrough(mission, 1)
          : missionActivenessThrough(mission, index + 1) -
            missionActivenessThrough(mission, index),
      ),
      otherRewards: shown.rewards.filter(
        (reward) => reward.itemId !== ACTIVENESS_ITEM,
      ),
    };
  });

export type RewardStatus = "reached" | "next" | "ahead";

export interface RewardLevelView {
  activeness: number;
  status: RewardStatus;
  remaining: number;
  rewards: { itemId: string; amount: number }[];
}

export interface DailiesSummary {
  missionsDone: number;
  missionsTotal: number;
  activeness: number;
  topReward: number;
  nextReward: number | null;
  toNextReward: number;
  tasksDone: number;
  tasksTotal: number;
  firstOpenTask: DailyTaskState | null;
}

export const summarizeDailies = (
  state: DailiesState,
  cycle: string,
): DailiesSummary => {
  const missions = buildMissionViews(state, cycle);
  const activeness = missions.reduce(
    (sum, mission) => sum + mission.activenessNow,
    0,
  );
  const next =
    rewardLevels.find((level) => level.activeness > activeness) ?? null;
  const openTasks = state.tasks.filter(
    (task) => !isTaskDone(state, task.id, cycle),
  );
  return {
    missionsDone: missions.filter((mission) => mission.level > 0).length,
    missionsTotal: missions.length,
    activeness,
    topReward: TOP_REWARD_ACTIVENESS,
    nextReward: next ? next.activeness : null,
    toNextReward: next ? next.activeness - activeness : 0,
    tasksDone: state.tasks.length - openTasks.length,
    tasksTotal: state.tasks.length,
    firstOpenTask: openTasks[0] ?? null,
  };
};

export const buildRewardLevelViews = (
  activeness: number,
): RewardLevelView[] => {
  const next = rewardLevels.find((level) => level.activeness > activeness);
  return rewardLevels.map((level) => ({
    activeness: level.activeness,
    status:
      level.activeness <= activeness
        ? "reached"
        : level === next
          ? "next"
          : "ahead",
    remaining: Math.max(0, level.activeness - activeness),
    rewards: level.rewards,
  }));
};

const freshMarks = (state: DailiesState, cycle: string): DailiesState => {
  const taskIds = new Set(state.tasks.map((task) => task.id));
  const done = Object.fromEntries(
    Object.entries(state.done).filter(
      ([id, date]) => taskIds.has(id) && date === cycle,
    ),
  );
  const missions = Object.fromEntries(
    Object.entries(state.missions ?? {}).filter(
      ([, saved]) => saved.cycleDate === cycle,
    ),
  );
  return { ...state, done, missions };
};

const withDailies = (
  chief: Playthrough,
  change: (state: DailiesState) => DailiesState,
) => ({
  ...chief,
  dailies: change(readDailies(chief)),
});

export const setMissionLevel = (
  chief: Playthrough,
  missionId: string,
  level: number,
  cycle: string,
): Playthrough =>
  withDailies(chief, (state) => {
    const current = freshMarks(state, cycle);
    const missions = { ...current.missions };
    if (level === 0) delete missions[missionId];
    else missions[missionId] = { level, cycleDate: cycle };
    return { ...current, missions };
  });

export const setTaskDone = (
  chief: Playthrough,
  taskId: string,
  done: boolean,
  cycle: string,
): Playthrough =>
  withDailies(chief, (state) => {
    const current = freshMarks(state, cycle);
    const marks = { ...current.done };
    if (done) marks[taskId] = cycle;
    else delete marks[taskId];
    return { ...current, done: marks };
  });

export const addTask = (chief: Playthrough, label: string): Playthrough =>
  withDailies(chief, (state) => ({
    ...state,
    tasks: [...state.tasks, { id: crypto.randomUUID(), label }],
  }));

export const renameTask = (
  chief: Playthrough,
  taskId: string,
  label: string,
): Playthrough =>
  withDailies(chief, (state) => ({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, label } : task,
    ),
  }));

export const removeTask = (chief: Playthrough, taskId: string): Playthrough =>
  withDailies(chief, (state) => {
    const done = { ...state.done };
    delete done[taskId];
    return {
      ...state,
      tasks: state.tasks.filter((task) => task.id !== taskId),
      done,
    };
  });

export interface RemovedTask {
  task: DailyTaskState;
  index: number;
  doneOn: string | undefined;
}

export const describeRemoval = (
  chief: Playthrough,
  taskId: string,
): RemovedTask | null => {
  const state = readDailies(chief);
  const index = state.tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;
  return { task: state.tasks[index], index, doneOn: state.done[taskId] };
};

export const restoreRemovedTask = (
  chief: Playthrough,
  removed: RemovedTask,
): Playthrough =>
  withDailies(chief, (state) => {
    if (state.tasks.some((task) => task.id === removed.task.id)) return state;
    const tasks = [...state.tasks];
    tasks.splice(Math.min(removed.index, tasks.length), 0, removed.task);
    const done = removed.doneOn
      ? { ...state.done, [removed.task.id]: removed.doneOn }
      : state.done;
    return { ...state, tasks, done };
  });

export const moveTask = (
  chief: Playthrough,
  taskId: string,
  step: -1 | 1,
): Playthrough =>
  withDailies(chief, (state) => {
    const from = state.tasks.findIndex((task) => task.id === taskId);
    const to = from + step;
    if (from === -1 || to < 0 || to >= state.tasks.length) return state;
    const tasks = [...state.tasks];
    [tasks[from], tasks[to]] = [tasks[to], tasks[from]];
    return { ...state, tasks };
  });

export const addStarterTask = (
  chief: Playthrough,
  starterId: StarterTaskId,
): Playthrough =>
  withDailies(chief, (state) =>
    state.tasks.some((task) => task.presetId === starterId)
      ? state
      : { ...state, tasks: [...state.tasks, starterTask(starterId)] },
  );

export const restoreStarterList = (chief: Playthrough): Playthrough =>
  withDailies(chief, (state) => {
    const have = new Set(state.tasks.map((task) => task.presetId));
    const missing = STARTER_TASKS.filter((task) => !have.has(task.id)).map(
      (task) => starterTask(task.id),
    );
    return {
      ...state,
      presetVersion: STARTER_VERSION,
      tasks: [...state.tasks, ...missing],
    };
  });

export type StarterStatus = "removed" | "new";

export interface StarterOffer {
  id: StarterTaskId;
  status: StarterStatus;
}

export const starterOffers = (state: DailiesState): StarterOffer[] => {
  const have = new Set(state.tasks.map((task) => task.presetId));
  return STARTER_TASKS.filter((task) => !have.has(task.id)).map((task) => ({
    id: task.id,
    status: task.since > state.presetVersion ? "new" : "removed",
  }));
};

const routineTaskId = (id: string) => `routine-${id}`;

export const countMissingRoutineTasks = (state: DailiesState) => {
  const have = new Set(state.tasks.map((task) => task.id));
  return routineTasks.filter((task) => !have.has(routineTaskId(task.id)))
    .length;
};

export const addRoutineTasks = (chief: Playthrough): Playthrough =>
  withDailies(chief, (state) => {
    const have = new Set(state.tasks.map((task) => task.id));
    const added = routineTasks
      .filter((task) => !have.has(routineTaskId(task.id)))
      .map((task) => ({ id: routineTaskId(task.id), label: task.name }));
    return { ...state, tasks: [...state.tasks, ...added] };
  });

export const setResetTime = (
  chief: Playthrough,
  resetTime: string,
  nowMs: number,
): Playthrough =>
  withDailies(chief, (state) => {
    const oldCycle = cycleDateAt(nowMs, state.resetTimeUtc);
    const newCycle = cycleDateAt(nowMs, resetTime);
    const current = freshMarks(state, oldCycle);
    const missions = Object.fromEntries(
      Object.entries(current.missions ?? {}).map(([id, saved]) => [
        id,
        { ...saved, cycleDate: newCycle },
      ]),
    );
    const done = Object.fromEntries(
      Object.keys(current.done).map((id) => [id, newCycle]),
    );
    return { ...current, resetTimeUtc: resetTime, missions, done };
  });

export const resetDailies = (chief: Playthrough): Playthrough =>
  withDailies(chief, (state) => ({ ...state, done: {}, missions: {} }));
