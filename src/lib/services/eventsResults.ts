import type { EventResultState, Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { rankingTablesOfEvent } from "@/data/game/gameEvents";
import type {
  GameEvent,
  GameEventRanking,
  GameEventReward,
  GameEventTier,
} from "@/data/game/gameEvents";

export type ResultKind =
  "participation" | "milestones" | "ranking" | "tier" | "waves";

export type TrendMetric = "score" | "rank";

export type HistoryPeriod = "3" | "6" | "all";

export interface MilestoneTarget {
  name: string;
  points?: number;
  rewardsText: string;
  needsPurchase: boolean;
}

const MONTH_MS = 30 * 86_400_000;

const rewardText = (reward: GameEventReward) =>
  reward.amount === undefined
    ? reward.name
    : `${formatNumber(reward.amount)} ${reward.name}`;

const rewardsTextOf = (rewards: GameEventReward[] | undefined) =>
  (rewards ?? []).map(rewardText).join(", ");

const daysWithMilestones = (event: GameEvent) =>
  (event.days ?? []).filter((day) => (day.milestones?.length ?? 0) > 0);

export const versionNamesOf = (event: GameEvent): string[] => {
  if (event.versions) return event.versions.map((version) => version.name);
  return daysWithMilestones(event).map((day) => day.name);
};

const tiersOfVersion = (
  event: GameEvent,
  version: string | undefined,
): GameEventTier[] => {
  if (event.versions) {
    const picked = event.versions.find((item) => item.name === version);
    return (picked ?? event.versions[0]).tiers ?? [];
  }
  const days = daysWithMilestones(event);
  if (days.length > 0) {
    const picked = days.find((day) => day.name === version) ?? days[0];
    return picked.milestones ?? [];
  }
  const tiers = event.tiers ?? [];
  if (event.resultShape === "ranking") {
    return tiers.filter((tier) => tier.scoreTotal !== undefined);
  }
  return event.resultShape === "milestones" ? tiers : [];
};

export const targetsOf = (
  event: GameEvent,
  version: string | undefined,
): MilestoneTarget[] => {
  const tiers = tiersOfVersion(event, version);
  const mentionsPurchase = (event.requirements ?? []).some((text) =>
    /purchase/i.test(text),
  );
  return tiers.map((tier, index) => ({
    name: tier.name,
    points: tier.scoreTotal,
    rewardsText: rewardsTextOf(tier.rewards),
    needsPurchase:
      event.versions !== undefined &&
      mentionsPurchase &&
      index === tiers.length - 1,
  }));
};

export const defaultVersionOf = (event: GameEvent): string | undefined => {
  const names = versionNamesOf(event);
  return (
    names.find((name) =>
      targetsOf(event, name).every((target) => target.points !== undefined),
    ) ?? names[0]
  );
};

export const resultKindOf = (event: GameEvent): ResultKind => {
  const shape = event.resultShape ?? "participation";
  if (
    shape === "milestones" &&
    targetsOf(event, defaultVersionOf(event)).length === 0
  ) {
    return "participation";
  }
  return shape;
};

const leaderboardName = (basedOn: string | undefined) =>
  basedOn?.match(/^(.+?) leaderboard/)?.[1];

export const scoreUnitOf = (event: GameEvent): string | undefined =>
  event.scoreUnit ??
  event.missionPointsLabel ??
  leaderboardName(event.personalRankings?.[0]?.basedOn);

export const reachedFromScore = (
  targets: MilestoneTarget[],
  score: number | undefined,
  current: string[],
): string[] =>
  targets
    .filter((target) =>
      target.points === undefined || score === undefined
        ? current.includes(target.name)
        : target.points <= score,
    )
    .map((target) => target.name);

const groupBounds = (group: string): [number, number] | undefined => {
  const digits = (text: string) => Number(text.replace(/,/g, ""));
  const range = group.match(/^([\d,]+)\s*-\s*([\d,]+)$/);
  if (range) return [digits(range[1]), digits(range[2])];
  const single = group.match(/^([\d,]+)$/);
  if (single) return [digits(single[1]), digits(single[1])];
  return undefined;
};

const rankingGroupsOf = (
  event: GameEvent,
  scope: "personal" | "alliance",
): GameEventRanking[] =>
  rankingTablesOfEvent(event).find((table) => table.scope === scope)
    ?.rankings ?? [];

export const rankGroupOf = (
  event: GameEvent,
  scope: "personal" | "alliance",
  rank: number | undefined,
): string | undefined => {
  if (rank === undefined) return undefined;
  return rankingGroupsOf(event, scope).find((ranking) => {
    const bounds = groupBounds(ranking.groupRanking);
    return bounds !== undefined && rank >= bounds[0] && rank <= bounds[1];
  })?.groupRanking;
};

export const rankGroupNamesOf = (
  event: GameEvent,
  scope: "personal" | "alliance",
): string[] =>
  rankingGroupsOf(event, scope).map((ranking) => ranking.groupRanking);

export const tiersWithPlacementOf = (event: GameEvent) =>
  (event.tiers ?? []).filter((tier) => (tier.rankings?.length ?? 0) > 0);

export const starChangeOf = (
  event: GameEvent,
  tierName: string | undefined,
  placement: string | undefined,
): number | undefined =>
  tiersWithPlacementOf(event)
    .find((tier) => tier.name === tierName)
    ?.rankings?.find((ranking) => ranking.groupRanking === placement)
    ?.starChange;

export const waveCountOf = (event: GameEvent) => event.waves?.length ?? 0;

export const difficultiesOf = (event: GameEvent) => event.tiers ?? [];

export const rewardLevelOf = (
  event: GameEvent,
  personalPoints: number | undefined,
  alliancePoints: number | undefined,
): number | undefined => {
  if (personalPoints === undefined || alliancePoints === undefined)
    return undefined;
  const reached = (event.pointLevels?.levels ?? []).filter(
    (level) =>
      level.personalPoints <= personalPoints &&
      level.alliancePoints <= alliancePoints,
  );
  return reached.length === 0 ? undefined : reached[reached.length - 1].level;
};

export const withResult = (
  chief: Playthrough,
  result: EventResultState,
): Playthrough => {
  const others = (chief.eventResults ?? []).filter(
    (item) =>
      item.id !== result.id &&
      !(item.eventId === result.eventId && item.runStart === result.runStart),
  );
  return { ...chief, eventResults: [...others, result] };
};

export const resultFor = (
  chief: Playthrough,
  eventId: string,
  runStart: string,
) =>
  (chief.eventResults ?? []).find(
    (item) => item.eventId === eventId && item.runStart === runStart,
  );

export const scoreOfResult = (
  result: EventResultState,
  event: GameEvent,
): number | undefined =>
  event.resultShape === "waves" ? result.personalPoints : result.score;

export interface HistoryRow {
  result: EventResultState;
  event: GameEvent;
}

export const historyRowsOf = (
  results: EventResultState[],
  events: GameEvent[],
  eventId: string,
  period: HistoryPeriod,
  nowMs: number,
): HistoryRow[] => {
  const since = period === "all" ? 0 : nowMs - Number(period) * MONTH_MS;
  return results
    .flatMap((result) => {
      const event = events.find((item) => item.id === result.eventId);
      return event ? [{ result, event }] : [];
    })
    .filter(
      (row) =>
        (eventId === "all" || row.result.eventId === eventId) &&
        Date.parse(row.result.runStart) >= since,
    )
    .sort(
      (a, b) => Date.parse(b.result.runStart) - Date.parse(a.result.runStart),
    );
};

export interface TrendPoint {
  runStart: string;
  value: number;
}

export const trendPointsOf = (
  rows: HistoryRow[],
  metric: TrendMetric,
): TrendPoint[] =>
  rows
    .flatMap((row) => {
      const value =
        metric === "score"
          ? scoreOfResult(row.result, row.event)
          : row.result.rank;
      return value === undefined
        ? []
        : [{ runStart: row.result.runStart, value }];
    })
    .reverse();

export interface TrendSummary {
  best: TrendPoint;
  average: number;
  latest: TrendPoint;
  count: number;
  change?: { amount: number; previous: TrendPoint };
}

export const summarizeTrend = (
  points: TrendPoint[],
  metric: TrendMetric,
): TrendSummary | undefined => {
  if (points.length === 0) return undefined;
  const better = (a: TrendPoint, b: TrendPoint) =>
    (metric === "score" ? a.value >= b.value : a.value <= b.value) ? a : b;
  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const total = points.reduce((sum, point) => sum + point.value, 0);
  return {
    best: points.reduce(better),
    average: Math.round(total / points.length),
    latest,
    count: points.length,
    change: previous
      ? {
          amount:
            metric === "score"
              ? latest.value - previous.value
              : previous.value - latest.value,
          previous,
        }
      : undefined,
  };
};

export const hasScoreOrRank = (rows: HistoryRow[]) => ({
  score: trendPointsOf(rows, "score").length > 0,
  rank: trendPointsOf(rows, "rank").length > 0,
});
