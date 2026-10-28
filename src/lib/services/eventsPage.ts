import type { Playthrough, UserEventGives, UserEventState } from "@/types/app";
import {
  addableGameEvents,
  EVENT_CATEGORIES,
  gameEventById,
  isCoreGameEvent,
} from "@/data/game/gameEvents";
import type { EventCategory, GameEvent } from "@/data/game/gameEvents";
import { DAY_MS, dayNumberOf, upcomingInstances } from "./eventsSchedule";
import type { EventsZone, RunInstance } from "./eventsSchedule";

export interface EventEntry {
  state: UserEventState;
  event: GameEvent;
}

export type CategoryFilter = EventCategory | "all";

export const CATEGORY_FILTERS: CategoryFilter[] = ["all", ...EVENT_CATEGORIES];

const UPCOMING_DAYS = 30;
const UPCOMING_GROUPS = 12;

export const entriesOfChief = (chief: Playthrough): EventEntry[] =>
  (chief.userEvents ?? []).flatMap((state) => {
    const event = gameEventById(state.eventId);
    return event ? [{ state, event }] : [];
  });

export const defaultGives = (event: GameEvent): UserEventGives => {
  const personal = (event.personalRankings?.length ?? 0) > 0;
  const alliance = (event.allianceRankings?.length ?? 0) > 0;
  if (personal && alliance) return "both";
  if (personal) return "personal";
  if (alliance) return "alliance";
  return "rewards";
};

export const resultsLiveInCoreEvents = (event: GameEvent) =>
  isCoreGameEvent(event.id);

export const categoryCounts = (): Record<CategoryFilter, number> => {
  const events = addableGameEvents();
  const counts = { all: events.length } as Record<CategoryFilter, number>;
  EVENT_CATEGORIES.forEach((category) => {
    counts[category] = events.filter(
      (event) => event.category === category,
    ).length;
  });
  return counts;
};

export const catalogMatches = (
  search: string,
  category: CategoryFilter,
): GameEvent[] => {
  const needle = search.trim().toLowerCase();
  return addableGameEvents().filter(
    (event) =>
      (category === "all" || event.category === category) &&
      event.name.toLowerCase().includes(needle),
  );
};

export interface UpcomingItem {
  entry: EventEntry;
  instance: RunInstance;
}

export interface UpcomingGroup {
  dayNumber: number;
  startMs: number;
  items: UpcomingItem[];
}

export const upcomingGroups = (
  entries: EventEntry[],
  nowMs: number,
  zone: EventsZone,
): UpcomingGroup[] => {
  const items = entries.flatMap((entry) =>
    upcomingInstances(entry.state, nowMs, nowMs + UPCOMING_DAYS * DAY_MS).map(
      (instance) => ({ entry, instance }),
    ),
  );
  items.sort((a, b) => a.instance.startMs - b.instance.startMs);

  const groups: UpcomingGroup[] = [];
  for (const item of items) {
    const dayNumber = dayNumberOf(item.instance.startMs, zone);
    const last = groups[groups.length - 1];
    if (last && last.dayNumber === dayNumber) {
      last.items.push(item);
    } else {
      groups.push({ dayNumber, startMs: item.instance.startMs, items: [item] });
    }
  }
  return groups.slice(0, UPCOMING_GROUPS);
};

export type Countdown =
  | { kind: "now" }
  | { kind: "today" }
  | { kind: "tomorrow" }
  | { kind: "days"; days: number };

export const countdownOf = (
  instance: RunInstance,
  nowMs: number,
  zone: EventsZone,
): Countdown => {
  if (instance.startMs <= nowMs) return { kind: "now" };
  const days = dayNumberOf(instance.startMs, zone) - dayNumberOf(nowMs, zone);
  if (days <= 0) return { kind: "today" };
  if (days === 1) return { kind: "tomorrow" };
  return { kind: "days", days };
};

export const withUserEvent = (
  chief: Playthrough,
  state: UserEventState,
): Playthrough => {
  const others = (chief.userEvents ?? []).filter(
    (item) => item.eventId !== state.eventId,
  );
  const position = (chief.userEvents ?? []).findIndex(
    (item) => item.eventId === state.eventId,
  );
  const next = [...others];
  next.splice(position === -1 ? next.length : position, 0, state);
  return { ...chief, userEvents: next };
};

export const withoutUserEvent = (
  chief: Playthrough,
  eventId: string,
): Playthrough => ({
  ...chief,
  userEvents: (chief.userEvents ?? []).filter(
    (item) => item.eventId !== eventId,
  ),
});
