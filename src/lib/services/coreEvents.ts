import { translator } from "@/i18n/formatter";
import {
  calculateAllianceShowdown,
  calculateHallOfChief,
  calculateKingOfIcefield,
  calculateSvs,
} from "whiteout-survival-data";
import type { GameEventDay, GameEventReward } from "whiteout-survival-data";
import type {
  CoreEventId,
  CoreEventState,
  EventDayResultState,
  EventHistoryEntry,
  EventLogState,
  EventOverallState,
  EventUsage,
  PlannedUpgrade,
  Playthrough,
} from "@/types/app";
import {
  BALDUR_ID,
  BALDUR_SKILL,
  CORE_EVENT_IDS,
  DEFAULT_HALL_SEASON,
  gameEventIdOf,
  gameEventOf,
  MS_PER_DAY,
  rankingTablesOf,
  SVS_BATTLE_DAY_ID,
  VALERIA_ID,
  VALERIA_SKILL,
} from "@/data/game/coreEvents";
import { findExpert } from "@/data/game/experts";
import { findItem } from "@/data/game/items";
import { DAY_MS, upcomingInstances } from "./eventsSchedule";
import { buildExpertViews } from "./experts";

export { SVS_BATTLE_DAY_ID };

export const shownEventsOf = (chief: Playthrough): CoreEventId[] =>
  CORE_EVENT_IDS.filter((id) =>
    (chief.coreEventsShown ?? CORE_EVENT_IDS).includes(id),
  );

/** The Hall of Chief season of the chief. The account setting does not exist yet, so it is 1. */
export const hallSeasonOf = (_chief: Playthrough) => DEFAULT_HALL_SEASON;

export const stateOf = (
  chief: Playthrough,
  event: CoreEventId,
): CoreEventState => chief.events?.[event] ?? {};

const withEventState = (
  chief: Playthrough,
  event: CoreEventId,
  change: (state: CoreEventState) => CoreEventState,
): Playthrough => ({
  ...chief,
  events: { ...chief.events, [event]: change(stateOf(chief, event)) },
});

export interface EventDay {
  id: string;
  name: string;
  phase?: "preparation" | "battle";
}

const gameDaysOf = (event: CoreEventId, chief: Playthrough): GameEventDay[] => {
  const days = gameEventOf(event).days as GameEventDay[];
  return event === "hall"
    ? days.filter((day) => day.day.startsWith(`s${hallSeasonOf(chief)}-`))
    : days;
};

export const eventDaysOf = (
  event: CoreEventId,
  chief: Playthrough,
): EventDay[] =>
  gameDaysOf(event, chief).map((day) => ({
    id: day.day,
    name: day.name,
    ...(event === "svs"
      ? { phase: day.day === SVS_BATTLE_DAY_ID ? "battle" : "preparation" }
      : {}),
  })) as EventDay[];

export const isBattleDay = (event: CoreEventId, dayId: string) =>
  event === "svs" && dayId === SVS_BATTLE_DAY_ID;

/** The short name of a day: Day 3, Battle, Days 6-7 or Stage 2. */
export const dayLabelOf = (event: CoreEventId, dayId: string) => {
  const t = translator("coreEvents");
  if (isBattleDay(event, dayId)) return t("days.battle");
  if (event === "hall") return t("days.stage", { number: dayId.split("-")[1] });
  if (dayId.includes("-")) return t("days.range", { range: dayId });
  return t("days.day", { number: dayId });
};

export interface ScoringRow {
  action: string;
  points: number;
  itemId?: string;
}

export const scoringRowsOf = (
  event: CoreEventId,
  dayId: string,
  chief: Playthrough,
): ScoringRow[] =>
  (
    gameDaysOf(event, chief).find((day) => day.day === dayId)?.scoring ?? []
  ).map((row) => ({
    action: row.action,
    points: row.points,
    itemId: row.itemId,
  }));

export const dayNoteOf = (
  event: CoreEventId,
  dayId: string,
  chief: Playthrough,
) => gameDaysOf(event, chief).find((day) => day.day === dayId)?.note;

// ---------- Counts: typed by the chief plus counts exported from plans ----------

const importsOf = (chief: Playthrough, event: CoreEventId) =>
  Object.values(chief.coreEvents?.imports ?? {}).filter(
    (item) => item.event === event,
  );

export const manualCountOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
) => stateOf(chief, event).usage?.[dayId]?.[action] ?? 0;

export const importedCountOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
) =>
  importsOf(chief, event).reduce(
    (total, item) => total + (item.counts[dayId]?.[action] ?? 0),
    0,
  );

/** The count that scores: what the chief typed plus what the plans of other pages exported. */
export const countOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
) =>
  manualCountOf(chief, event, dayId, action) +
  importedCountOf(chief, event, dayId, action);

/** The field shows the total. Typing a total below the exported part keeps the exported part. */
export const withActionCount = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
  total: number,
): Playthrough => {
  const manual = Math.max(
    0,
    Math.trunc(total) - importedCountOf(chief, event, dayId, action),
  );
  return withEventState(chief, event, (state) => {
    const day = { ...state.usage?.[dayId] };
    if (manual === 0) delete day[action];
    else day[action] = manual;
    return { ...state, usage: { ...state.usage, [dayId]: day } };
  });
};

const usageInputOf = (chief: Playthrough, event: CoreEventId): EventUsage => {
  const usage: EventUsage = {};
  for (const day of eventDaysOf(event, chief)) {
    for (const row of scoringRowsOf(event, day.id, chief)) {
      const count = countOf(chief, event, day.id, row.action);
      if (count > 0) usage[day.id] = { ...usage[day.id], [row.action]: count };
    }
  }
  return usage;
};

// ---------- Bonus levels read from the Experts page ----------

const expertSkillLevelOf = (
  chief: Playthrough,
  expertId: string,
  skillName: string,
) => {
  const view = buildExpertViews(chief).find(
    (item) => item.expert.id === expertId,
  );
  if (!view?.recruited) return null;
  const index = view.expert.skills.findIndex(
    (skill) => skill.name === skillName,
  );
  const level = view.skillLevels[index];
  return index >= 0 && level >= 1 ? level : null;
};

export const valeriaLevelOf = (chief: Playthrough) =>
  expertSkillLevelOf(chief, VALERIA_ID, VALERIA_SKILL);

export const baldurLevelOf = (chief: Playthrough) =>
  expertSkillLevelOf(chief, BALDUR_ID, BALDUR_SKILL);

export interface EventBonus {
  expertId: string;
  expertName: string;
  skillName: string;
  level: number | null;
}

/** The expert whose skill changes the points of an event. Null for King of Icefield and Hall of Chief. */
export const eventBonusOf = (
  chief: Playthrough,
  event: CoreEventId,
): EventBonus | null => {
  if (event === "svs" || event === "showdown") {
    const expertId = event === "svs" ? VALERIA_ID : BALDUR_ID;
    return {
      expertId,
      expertName: findExpert(expertId)?.name ?? expertId,
      skillName: event === "svs" ? VALERIA_SKILL : BALDUR_SKILL,
      level: event === "svs" ? valeriaLevelOf(chief) : baldurLevelOf(chief),
    };
  }
  return null;
};

// ---------- Points ----------

export interface DayResult {
  id: string;
  name: string;
  phase?: "preparation" | "battle";
  base: number;
  bonus: number;
  total: number;
}

export interface EventScore {
  base: number;
  bonus: number;
  total: number;
}

export interface EventResult {
  days: DayResult[];
  event: EventScore;
  bonusPercent: number;
  preparation?: EventScore;
  battle?: EventScore;
}

const sumScores = (days: DayResult[]): EventScore => ({
  base: days.reduce((total, day) => total + day.base, 0),
  bonus: days.reduce((total, day) => total + day.bonus, 0),
  total: days.reduce((total, day) => total + day.total, 0),
});

export const calculateEvent = (
  chief: Playthrough,
  event: CoreEventId,
): EventResult => {
  const usage = usageInputOf(chief, event);
  const toDay = (day: {
    day: string;
    name: string;
    base: number;
    bonus: number;
    total: number;
    phase?: "preparation" | "battle";
  }): DayResult => ({
    id: day.day,
    name: day.name,
    phase: day.phase,
    base: day.base,
    bonus: day.bonus,
    total: day.total,
  });

  if (event === "svs") {
    const level = valeriaLevelOf(chief);
    const result = calculateSvs(
      usage,
      level === null ? {} : { valeriaLevel: level },
    );
    return {
      days: result.days.map(toDay),
      event: result.event,
      bonusPercent: result.valeriaBonusPercent,
      preparation: result.preparation,
      battle: result.battle,
    };
  }
  if (event === "showdown") {
    const level = baldurLevelOf(chief);
    const result = calculateAllianceShowdown(
      usage,
      level === null ? {} : { dawnHymnLevel: level },
    );
    // The package leaves the truck actions out of Dawn Hymn. In the game the percent applies to
    // every action, so the bonus is taken from the whole day.
    const days = result.days.map((day) => {
      const bonus = Math.round((day.base * result.dawnHymnBonusPercent) / 100);
      return toDay({ ...day, bonus, total: day.base + bonus });
    });
    return {
      days,
      event: sumScores(days),
      bonusPercent: result.dawnHymnBonusPercent,
    };
  }
  if (event === "king") {
    const result = calculateKingOfIcefield(usage);
    return {
      days: result.days.map(toDay),
      event: result.event,
      bonusPercent: 0,
    };
  }
  const season = `s${hallSeasonOf(chief)}-`;
  const days = calculateHallOfChief(usage)
    .days.filter((day) => day.day.startsWith(season))
    .map(toDay);
  return { days, event: sumScores(days), bonusPercent: 0 };
};

export const dayTotalOf = (result: EventResult, dayId: string) =>
  result.days.find((day) => day.id === dayId)?.total ?? 0;

// ---------- Point thresholds and ranks ----------

export interface Milestone {
  name: string;
  scoreTotal: number;
  rewards: GameEventReward[];
  reached: boolean;
  missing: number;
}

/** The personal milestones of a day compared with the day total, which includes the bonus. */
export const milestonesOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  dayTotal: number,
): Milestone[] =>
  (
    gameDaysOf(event, chief).find((day) => day.day === dayId)?.milestones ?? []
  ).flatMap((tier) =>
    tier.scoreTotal === undefined
      ? []
      : [
          {
            name: tier.name,
            scoreTotal: tier.scoreTotal,
            rewards: tier.rewards ?? [],
            reached: dayTotal >= tier.scoreTotal,
            missing: Math.max(0, tier.scoreTotal - dayTotal),
          },
        ],
  );

/** The extra tiers that Valeria adds to the thresholds of days 1 to 5 at her level. 0 when none. */
export const extraTierCountOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
) => {
  if (event !== "svs" || isBattleDay(event, dayId)) return 0;
  const level = valeriaLevelOf(chief);
  if (level === null) return 0;
  const skill = findExpert(VALERIA_ID)?.skills.find(
    (item) => item.name === VALERIA_SKILL,
  );
  return (
    skill?.progressions.find(
      (progression) => progression.label === "Extra Tier",
    )?.values[level - 1] ?? 0
  );
};

export interface RankRow {
  rank: string;
  /** The top Gems reward, or null when the table has none. */
  gems: number | null;
  notConfirmed: boolean;
}

export interface RankTable {
  basedOn: string;
  rows: RankRow[];
}

const personalTableIdOf = (
  event: CoreEventId,
  dayId: string,
): string | null => {
  if (event === "svs") return isBattleDay(event, dayId) ? "tier-3" : "tier-1";
  if (event === "king" || event === "hall") return "personal-1";
  return null;
};

/** The personal ranking of the day: a rank and its top Gems reward. No points cutoff is implied. */
export const rankTableOf = (
  event: CoreEventId,
  dayId: string,
): RankTable | null => {
  const id = personalTableIdOf(event, dayId);
  const table = rankingTablesOf(event).find((item) => item.id === id);
  if (!table) return null;
  return {
    basedOn: table.name ?? table.basedOn ?? "",
    rows: table.rankings.map((ranking) => {
      const gems = ranking.rewards.find((reward) => reward.itemId === "gems");
      return {
        rank: ranking.groupRanking,
        gems: gems?.amount ?? null,
        notConfirmed: ranking.rewards.some((reward) => Boolean(reward.note)),
      };
    }),
  };
};

// ---------- Event dates and the day of today ----------

const CALENDAR_LOOKAHEAD_DAYS = 90;

const utcDateOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * The window of the next run in the cycle that the player defined on the Events page. A run whose
 * start date is already in the history was ended early, so the search moves to the next run.
 */
const calendarDatesOf = (
  chief: Playthrough,
  event: CoreEventId,
  now: number,
): { start: string; end: string } | null => {
  const state = (chief.userEvents ?? []).find(
    (item) => item.eventId === gameEventIdOf[event],
  );
  if (!state) return null;
  const endedStarts = new Set(
    (stateOf(chief, event).history ?? []).map((entry) => entry.start),
  );
  const next = upcomingInstances(
    state,
    now,
    now + CALENDAR_LOOKAHEAD_DAYS * DAY_MS,
  ).find((instance) => !endedStarts.has(utcDateOf(instance.startMs)));
  return next
    ? { start: utcDateOf(next.startMs), end: utcDateOf(next.endMs - 1) }
    : null;
};

/** The saved dates of the event. Without saved dates they come from the Events page cycle. */
export const eventDatesOf = (
  chief: Playthrough,
  event: CoreEventId,
  now: number,
): { start?: string; end?: string } => {
  const saved = stateOf(chief, event).log ?? {};
  if (saved.start || saved.end) return { start: saved.start, end: saved.end };
  return calendarDatesOf(chief, event, now) ?? {};
};

export interface EventStatus {
  live: boolean;
  /** The day or stage id of today, or null when the event is not running or has no dates. */
  todayId: string | null;
}

const dayNumberOf = (start: string, today: string) =>
  Math.floor((Date.parse(today) - Date.parse(start)) / MS_PER_DAY) + 1;

export const eventStatusOf = (
  chief: Playthrough,
  event: CoreEventId,
  now: number,
): EventStatus => {
  const { start, end } = eventDatesOf(chief, event, now);
  if (!start || !end) return { live: false, todayId: null };
  const today = new Date(now).toISOString().slice(0, 10);
  if (today < start || today > end) return { live: false, todayId: null };
  const number = dayNumberOf(start, today);
  const days = eventDaysOf(event, chief);
  const numbered = days.filter((day) => !isBattleDay(event, day.id));
  const lastNumbered = numbered[numbered.length - 1]?.id;
  const todayId =
    number <= numbered.length
      ? numbered[number - 1].id
      : (days.find((day) => isBattleDay(event, day.id))?.id ??
        lastNumbered ??
        null);
  return { live: true, todayId };
};

/** A day that has not started yet. It cannot get a score. Without dates every day is open. */
export const dayOpensLater = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  now: number,
) => {
  const { start, end } = eventDatesOf(chief, event, now);
  if (!start || !end) return false;
  const today = new Date(now).toISOString().slice(0, 10);
  if (today > end) return false;
  if (today < start) return true;
  const days = eventDaysOf(event, chief);
  const index = days.findIndex((day) => day.id === dayId);
  const todayIndex = days.findIndex(
    (day) => day.id === eventStatusOf(chief, event, now).todayId,
  );
  return todayIndex >= 0 && index > todayIndex;
};

// ---------- Event log ----------

export const logOf = (chief: Playthrough, event: CoreEventId): EventLogState =>
  stateOf(chief, event).log ?? {};

const withLog = (
  chief: Playthrough,
  event: CoreEventId,
  change: (log: EventLogState) => EventLogState,
) =>
  withEventState(chief, event, (state) => ({
    ...state,
    log: change(state.log ?? {}),
  }));

export const withEventDates = (
  chief: Playthrough,
  event: CoreEventId,
  start: string | undefined,
  end: string | undefined,
) => withLog(chief, event, (log) => ({ ...log, start, end }));

export const withDayResult = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  patch: Partial<EventDayResultState>,
) =>
  withLog(chief, event, (log) => ({
    ...log,
    days: { ...log.days, [dayId]: { ...log.days?.[dayId], ...patch } },
  }));

export const withOverallResult = (
  chief: Playthrough,
  event: CoreEventId,
  patch: Partial<EventOverallState>,
) =>
  withLog(chief, event, (log) => ({
    ...log,
    overall: { ...log.overall, ...patch },
  }));

/** The days that count in the overall result. The Battle Phase has its own result. */
export const overallDaysOf = (event: CoreEventId, chief: Playthrough) =>
  eventDaysOf(event, chief).filter((day) => !isBattleDay(event, day.id));

export const lockedTotalOf = (chief: Playthrough, event: CoreEventId) => {
  const log = logOf(chief, event);
  return overallDaysOf(event, chief).reduce(
    (total, day) =>
      log.days?.[day.id]?.locked
        ? total + (log.days[day.id].score ?? 0)
        : total,
    0,
  );
};

export const unlockedDaysOf = (chief: Playthrough, event: CoreEventId) => {
  const log = logOf(chief, event);
  return eventDaysOf(event, chief).filter((day) => !log.days?.[day.id]?.locked);
};

// ---------- End event and history ----------

export const plannedTotalsOf = (chief: Playthrough, event: CoreEventId) =>
  Object.fromEntries(
    calculateEvent(chief, event).days.map((day) => [day.id, day.total]),
  );

export const plannedUpgradesOf = (
  chief: Playthrough,
  event: CoreEventId,
): PlannedUpgrade[] =>
  importsOf(chief, event).flatMap((item) => item.upgrades ?? []);

export const historyOf = (
  chief: Playthrough,
  event: CoreEventId,
): EventHistoryEntry[] =>
  [...(stateOf(chief, event).history ?? [])].sort((a, b) =>
    b.endedAt.localeCompare(a.endedAt),
  );

/**
 * Saves the log with a snapshot of the plan to the history, then clears the counts, the log, the
 * checks and the plans exported to this event. Goals on other pages stay.
 */
export const endEvent = (
  chief: Playthrough,
  event: CoreEventId,
  endedAt: string,
): Playthrough => {
  const log = logOf(chief, event);
  const { start, end } = eventDatesOf(chief, event, Date.parse(endedAt));
  const entry: EventHistoryEntry = {
    id: endedAt,
    start,
    end,
    endedAt,
    days: log.days ?? {},
    overall: log.overall ?? {},
    totalScore: lockedTotalOf(chief, event),
    plan: plannedTotalsOf(chief, event),
    upgrades: plannedUpgradesOf(chief, event),
  };
  const imports = Object.fromEntries(
    Object.entries(chief.coreEvents?.imports ?? {}).filter(
      ([, item]) => item.event !== event,
    ),
  );
  const ended = withEventState(chief, event, (state) => ({
    history: [...(state.history ?? []), entry],
    usage: undefined,
    log: undefined,
    checklist: undefined,
  }));
  return { ...ended, coreEvents: { ...chief.coreEvents, imports } };
};

export const withoutHistoryEntry = (
  chief: Playthrough,
  event: CoreEventId,
  entryId: string,
) =>
  withEventState(chief, event, (state) => ({
    ...state,
    history: (state.history ?? []).filter((entry) => entry.id !== entryId),
  }));

// ---------- Plan checklist ----------

export const CASTLE_KEY = "castle";

export const checkedOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
) => stateOf(chief, event).checklist?.[dayId]?.[action] === true;

export const withChecked = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  action: string,
  checked: boolean,
) =>
  withEventState(chief, event, (state) => {
    const day = { ...state.checklist?.[dayId] };
    if (checked) day[action] = true;
    else delete day[action];
    return { ...state, checklist: { ...state.checklist, [dayId]: day } };
  });

export const withClearedChecks = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
) =>
  withEventState(chief, event, (state) => {
    const checklist = { ...state.checklist };
    delete checklist[dayId];
    return { ...state, checklist };
  });

export const castleSignedUpOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
) => stateOf(chief, event).checklist?.[CASTLE_KEY]?.[dayId] === true;

export const withCastleSignedUp = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
  signedUp: boolean,
) =>
  withEventState(chief, event, (state) => {
    const castle = { ...state.checklist?.[CASTLE_KEY] };
    if (signedUp) castle[dayId] = true;
    else delete castle[dayId];
    return {
      ...state,
      checklist: { ...state.checklist, [CASTLE_KEY]: castle },
    };
  });

/** A day has a next day to sign up for unless it is the last one. */
export const hasNextDay = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
) => {
  const days = eventDaysOf(event, chief);
  return days.findIndex((day) => day.id === dayId) < days.length - 1;
};

export interface ChecklistAction {
  action: string;
  count: number;
  points: number;
  total: number;
  checked: boolean;
}

export const checklistActionsOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
): ChecklistAction[] =>
  scoringRowsOf(event, dayId, chief).flatMap((row) => {
    const count = countOf(chief, event, dayId, row.action);
    return count > 0
      ? [
          {
            action: row.action,
            count,
            points: row.points,
            total: count * row.points,
            checked: checkedOf(chief, event, dayId, row.action),
          },
        ]
      : [];
  });

export interface ResourceToUse {
  name: string;
  amount: number;
}

const USE_PREFIX = /^Use (?:any )?1 /;

/** Items the day spends. Only actions that start with Use 1 or Use any 1 count, and equal items add up. */
export const resourcesToUseOf = (
  chief: Playthrough,
  event: CoreEventId,
  dayId: string,
): ResourceToUse[] => {
  const totals = new Map<string, number>();
  for (const row of scoringRowsOf(event, dayId, chief)) {
    if (!USE_PREFIX.test(row.action)) continue;
    const count = countOf(chief, event, dayId, row.action);
    if (count === 0) continue;
    const name =
      (row.itemId ? findItem(row.itemId)?.name : undefined) ??
      row.action.replace(USE_PREFIX, "");
    totals.set(name, (totals.get(name) ?? 0) + count);
  }
  return [...totals].map(([name, amount]) => ({ name, amount }));
};
