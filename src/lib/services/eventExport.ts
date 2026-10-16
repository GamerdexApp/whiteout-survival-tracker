import type {
  CoreEventId,
  CoreEventImport,
  EventUsage,
  PlannedUpgrade,
  Playthrough,
} from "@/types/app";
import { CORE_EVENT_IDS } from "@/data/game/coreEvents";
import { eventDaysOf, scoringRowsOf } from "./coreEvents";
import type { ScoringRow } from "./coreEvents";

/**
 * One thing a plan can score in an event, such as the Hero Shards of a plan. `matches` tells
 * whether a scoring row of the event pays it, by the exact action text of the package. The points
 * of the line are the units times the points of the row.
 */
export interface ExportLine {
  id: string;
  label: string;
  units: number;
  /** Text under the label, such as the names of the heroes behind the count. */
  detail?: string;
  matches: (event: CoreEventId, action: string) => boolean;
}

/** An item of the plan that no event scores. It is listed with a reason and adds no points. */
export interface UnscoredLine {
  id: string;
  label: string;
  units: number;
  reason: string;
}

/** Lines that share one event day. Heroes export Shards and Widgets on two different days. */
export interface ExportGroup {
  id: string;
  label?: string;
  lines: ExportLine[];
  unscored?: UnscoredLine[];
}

export type ExportUpgrade = Omit<PlannedUpgrade, "day"> & { groupId?: string };

export interface ExportSpec {
  /** The key under `coreEvents.imports`. One import for each page. */
  page: string;
  groups: ExportGroup[];
  upgrades?: ExportUpgrade[];
}

export type DayByGroup = Record<string, string>;

export const rowForLine = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  line: ExportLine,
): ScoringRow | undefined =>
  scoringRowsOf(event, dayId, chief).find((row) =>
    line.matches(event, row.action),
  );

/** The days of an event where at least one line of the group has a scoring row. */
export const scoringDaysOf = (
  chief: Playthrough,
  event: CoreEventId,
  group: ExportGroup,
) =>
  eventDaysOf(event, chief).filter((day) =>
    group.lines.some((line) => rowForLine(chief, event, day.id, line)),
  );

export interface ScoredLine {
  line: ExportLine;
  row: ScoringRow | undefined;
  points: number;
}

export const scoreGroup = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  group: ExportGroup,
): { lines: ScoredLine[]; total: number } => {
  const lines = group.lines.map((line) => {
    const row = rowForLine(chief, event, dayId, line);
    return { line, row, points: row ? line.units * row.points : 0 };
  });
  return { lines, total: lines.reduce((sum, item) => sum + item.points, 0) };
};

/** The points of the whole plan in an event with no day: each line on its first scoring row. */
export const eventSummaryOf = (
  chief: Playthrough,
  spec: ExportSpec,
): Record<CoreEventId, number> =>
  Object.fromEntries(
    CORE_EVENT_IDS.map((event) => [
      event,
      spec.groups.reduce(
        (total, group) =>
          total +
          group.lines.reduce((sum, line) => {
            for (const day of eventDaysOf(event, chief)) {
              const row = rowForLine(chief, event, day.id, line);
              if (row) return sum + line.units * row.points;
            }
            return sum;
          }, 0),
        0,
      ),
    ]),
  ) as Record<CoreEventId, number>;

export const firstDayByGroup = (
  chief: Playthrough,
  event: CoreEventId,
  spec: ExportSpec,
): DayByGroup =>
  Object.fromEntries(
    spec.groups.flatMap((group) => {
      const day = scoringDaysOf(chief, event, group)[0];
      return day ? [[group.id, day.id]] : [];
    }),
  );

const countsOf = (
  chief: Playthrough,
  event: CoreEventId,
  spec: ExportSpec,
  dayByGroup: DayByGroup,
): EventUsage => {
  const counts: EventUsage = {};
  for (const group of spec.groups) {
    const dayId = dayByGroup[group.id];
    if (!dayId) continue;
    for (const line of group.lines) {
      const row = rowForLine(chief, event, dayId, line);
      if (row && line.units > 0) {
        counts[dayId] = {
          ...counts[dayId],
          [row.action]: (counts[dayId]?.[row.action] ?? 0) + line.units,
        };
      }
    }
  }
  return counts;
};

export const importOf = (
  chief: Playthrough,
  event: CoreEventId,
  spec: ExportSpec,
  dayByGroup: DayByGroup,
  savedAt: string,
): CoreEventImport => ({
  event,
  savedAt,
  counts: countsOf(chief, event, spec, dayByGroup),
  upgrades: (spec.upgrades ?? []).flatMap(({ groupId, ...upgrade }) => {
    const day = dayByGroup[groupId ?? spec.groups[0].id];
    return day ? [{ ...upgrade, day }] : [];
  }),
});

/** A new export of a page replaces its earlier one, even when it went to another event. */
export const withExportedPlan = (
  chief: Playthrough,
  spec: ExportSpec,
  event: CoreEventId,
  dayByGroup: DayByGroup,
  savedAt: string,
): Playthrough => ({
  ...chief,
  coreEvents: {
    ...chief.coreEvents,
    imports: {
      ...chief.coreEvents?.imports,
      [spec.page]: importOf(chief, event, spec, dayByGroup, savedAt),
    },
  },
});

export const withoutExportedPlan = (
  chief: Playthrough,
  page: string,
): Playthrough => {
  const imports = { ...chief.coreEvents?.imports };
  delete imports[page];
  return { ...chief, coreEvents: { ...chief.coreEvents, imports } };
};

export const exportedPlanOf = (chief: Playthrough, page: string) =>
  chief.coreEvents?.imports?.[page];

/** The scoring row text that a line pays, built from the `Use 1 <item>` style rows of an event. */
export const actionMatcher =
  (pattern: RegExp) => (_event: CoreEventId, action: string) =>
    pattern.test(action);
