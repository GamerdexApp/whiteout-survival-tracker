import type { CoreEventId, DailyTaskState, Playthrough } from "@/types/app";
import {
  NEXT_RUNS_SHOWN,
  OPEN_TASKS_SHOWN,
  WEEK_DAYS,
} from "@/data/game/overviewTotals";
import { T12_UNLOCK_DAYS, WAR_ACADEMY_UNLOCK_DAYS } from "@/data/game/research";
import {
  calculateEvent,
  castleSignedUpOf,
  checklistActionsOf,
  eventDaysOf,
  eventStatusOf,
  hasNextDay,
  logOf,
  overallDaysOf,
  shownEventsOf,
} from "./coreEvents";
import {
  cycleDateAt,
  isTaskDone,
  readDailies,
  summarizeDailies,
} from "./dailies";
import type { Countdown, EventEntry } from "./eventsPage";
import { countdownOf, entriesOfChief, upcomingGroups } from "./eventsPage";
import type { EventsZone, RunInstance } from "./eventsSchedule";
import { DAY_MS } from "./eventsSchedule";
import type { HistoryRow } from "./historyEvents";
import { endedEventsOf, upgradeDoneOf } from "./historyEvents";
import { serverAgeDays } from "./research";
import { isWarAcademyOpenOnDay, unlockOverrideOf } from "./unlocks";

export const dailiesTodayOf = (chief: Playthrough, now: number) => {
  const state = readDailies(chief);
  const cycle = cycleDateAt(now, state.resetTimeUtc);
  const openTasks: DailyTaskState[] = state.tasks.filter(
    (task) => !isTaskDone(state, task.id, cycle),
  );
  return {
    summary: summarizeDailies(state, cycle),
    openTasks: openTasks.slice(0, OPEN_TASKS_SHOWN),
    openCount: openTasks.length,
  };
};

export interface LiveCoreEvent {
  event: CoreEventId;
  todayId: string;
  dayName: string;
  dayNumber: number;
  dayCount: number;
}

export const liveCoreEventsOf = (
  chief: Playthrough,
  now: number,
): LiveCoreEvent[] =>
  shownEventsOf(chief).flatMap((event) => {
    const { live, todayId } = eventStatusOf(chief, event, now);
    if (!live || todayId === null) return [];
    const days = eventDaysOf(event, chief);
    const index = days.findIndex((day) => day.id === todayId);
    return [
      {
        event,
        todayId,
        dayName: days[index]?.name ?? "",
        dayNumber: index + 1,
        dayCount: days.length,
      },
    ];
  });

export interface UpcomingRun {
  key: string;
  entry: EventEntry;
  instance: RunInstance;
  countdown: Countdown;
}

const upcomingRunsOf = (
  chief: Playthrough,
  now: number,
  zone: EventsZone,
): UpcomingRun[] =>
  upcomingGroups(entriesOfChief(chief), now, zone).flatMap((group) =>
    group.items.map(({ entry, instance }) => ({
      key: `${entry.event.id}-${instance.runIndex}-${instance.startMs}`,
      entry,
      instance,
      countdown: countdownOf(instance, now, zone),
    })),
  );

export const liveRunsOf = (chief: Playthrough, now: number, zone: EventsZone) =>
  upcomingRunsOf(chief, now, zone).filter(
    (run) => run.countdown.kind === "now",
  );

export const nextRunsOf = (chief: Playthrough, now: number, zone: EventsZone) =>
  upcomingRunsOf(chief, now, zone)
    .filter((run) => run.countdown.kind !== "now")
    .slice(0, NEXT_RUNS_SHOWN);

export interface EventsTile {
  liveCount: number;
  firstLiveCore: LiveCoreEvent | undefined;
  startingThisWeek: number;
}

export const eventsTileOf = (
  chief: Playthrough,
  now: number,
  zone: EventsZone,
): EventsTile => {
  const core = liveCoreEventsOf(chief, now);
  const runs = upcomingRunsOf(chief, now, zone);
  return {
    liveCount:
      core.length + runs.filter((run) => run.countdown.kind === "now").length,
    firstLiveCore: core[0],
    startingThisWeek: runs.filter(
      (run) =>
        run.countdown.kind !== "now" &&
        run.instance.startMs < now + WEEK_DAYS * DAY_MS,
    ).length,
  };
};

export interface CoreToday {
  event: CoreEventId;
  dayId: string;
  dayName: string;
  planTotal: number;
  actionCount: number;
  actionsDone: number;
  nextDayId: string | null;
  castleSignedUp: boolean;
  lockedDays: number;
  dayCount: number;
  todayLocked: boolean;
}

export const coreTodayOf = (
  chief: Playthrough,
  now: number,
): CoreToday | null => {
  const live = liveCoreEventsOf(chief, now)[0];
  if (!live) return null;
  const { event, todayId } = live;
  const days = eventDaysOf(event, chief);
  const actions = checklistActionsOf(chief, event, todayId);
  const log = logOf(chief, event);
  const overall = overallDaysOf(event, chief);
  return {
    event,
    dayId: todayId,
    dayName: live.dayName,
    planTotal:
      calculateEvent(chief, event).days.find((day) => day.id === todayId)
        ?.total ?? 0,
    actionCount: actions.length,
    actionsDone: actions.filter((action) => action.checked).length,
    nextDayId: hasNextDay(chief, event, todayId)
      ? days[days.findIndex((day) => day.id === todayId) + 1].id
      : null,
    castleSignedUp: castleSignedUpOf(chief, event, todayId),
    lockedDays: overall.filter((day) => log.days?.[day.id]?.locked).length,
    dayCount: overall.length,
    todayLocked: log.days?.[todayId]?.locked === true,
  };
};

export interface LastResult {
  row: HistoryRow;
  upgradesPlanned: number;
  upgradesDone: number;
}

export const lastResultOf = (chief: Playthrough): LastResult | null => {
  const row = endedEventsOf(chief, "all")[0];
  if (!row) return null;
  const states = row.entry.upgrades
    .map((upgrade) => upgradeDoneOf(chief, upgrade))
    .filter((state) => state !== null);
  return {
    row,
    upgradesPlanned: states.length,
    upgradesDone: states.filter((state) => state).length,
  };
};

export interface UnlockState {
  open: boolean;
  daysLeft: number;
}

export interface ServerAge {
  days: number | null;
  startDate: string | undefined;
  warAcademy: UnlockState | null;
  t12: UnlockState | null;
  heroGeneration: number;
}

const unlockStateOf = (
  chief: Playthrough,
  age: number | null,
  unlockDays: number,
  now: number,
): UnlockState | null =>
  age === null && unlockOverrideOf(chief, "warAcademy") === null
    ? null
    : {
        open: isWarAcademyOpenOnDay(chief, unlockDays, new Date(now)),
        daysLeft: age === null ? 0 : Math.max(0, unlockDays - age),
      };

export const serverAgeOf = (chief: Playthrough, now: number): ServerAge => {
  const days = serverAgeDays(chief, new Date(now));
  return {
    days,
    startDate: chief.serverStartDate,
    warAcademy: unlockStateOf(chief, days, WAR_ACADEMY_UNLOCK_DAYS, now),
    t12: unlockStateOf(chief, days, T12_UNLOCK_DAYS, now),
    heroGeneration: chief.heroGenerationUnlocked,
  };
};
