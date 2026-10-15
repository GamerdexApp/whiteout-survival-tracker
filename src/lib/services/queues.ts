import type {
  ConstructionJob,
  Playthrough,
  ResearchJob,
  ResearchQueueId,
  UpgradeJob,
  UpgradeLogEntry,
} from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import { findResearch, levelData } from "@/data/game/research";
import { shelterLevels, withLevel, withShelterLevels } from "./buildings";
import { ownedCount, withOwnedCounts } from "./inventory";
import { withResearchLevel } from "./research";

export const BUILDER_NUMBERS = [1, 2] as const;
export const RESEARCH_QUEUES: {
  id: ResearchQueueId;
  name: string;
  tabs: string;
}[] = [
  { id: "main", name: "Research queue", tabs: "Growth, Economy and Battle" },
  { id: "warAcademy", name: "War Academy queue", tabs: "T11 and T12" },
];

const SECOND_MS = 1_000;
const MINUTE_SECONDS = 60;

export const constructionJobs = (chief: Playthrough): ConstructionJob[] =>
  chief.queues?.construction ?? [];

export const researchJobs = (chief: Playthrough): ResearchJob[] =>
  chief.queues?.research ?? [];

export const builderJob = (chief: Playthrough, builder: number) =>
  constructionJobs(chief).find((job) => job.builder === builder);

export const queueJob = (chief: Playthrough, queue: ResearchQueueId) =>
  researchJobs(chief).find((job) => job.queue === queue);

export const buildingJob = (chief: Playthrough, buildingId: string) =>
  constructionJobs(chief).find((job) => job.buildingId === buildingId);

export const idleBuilders = (chief: Playthrough) =>
  BUILDER_NUMBERS.filter((builder) => !builderJob(chief, builder));

/**
 * Seconds left. The end time is saved, never a countdown, so the time stays right when the app is
 * closed.
 */
export const secondsLeft = (job: UpgradeJob, now: number) =>
  Math.max(0, Math.ceil((new Date(job.endsAt).getTime() - now) / SECOND_MS));

export const jobProgress = (job: UpgradeJob, now: number) => {
  const start = new Date(job.startedAt).getTime();
  const total = new Date(job.endsAt).getTime() - start;
  return total <= 0 ? 1 : Math.min(1, Math.max(0, (now - start) / total));
};

export const isReady = (job: UpgradeJob, now: number) =>
  secondsLeft(job, now) === 0;

export const endsAtAfter = (now: Date, seconds: number) =>
  new Date(now.getTime() + seconds * SECOND_MS).toISOString();

export const secondsFrom = (hours: number, minutes: number) =>
  Math.max(0, Math.floor(hours)) * 3_600 +
  Math.max(0, Math.floor(minutes)) * MINUTE_SECONDS;

export interface CostLine {
  itemId: string;
  name: string;
  amount: number;
}

export interface UpgradeOption {
  id: string;
  label: string;
  name: string;
  img?: string;
  subtitle: string;
  cost: CostLine[];
  baseSeconds: number | undefined;
  power: number;
  slotKeys: string[];
  from: string | null;
  to: string;
  /** The shelter that the upgrade raises. Only a shelter has one. */
  instance?: number;
}

export interface SlotInfo {
  key: string;
  label: string;
  busyText?: string;
}

export interface StartPayload {
  optionId: string;
  slotKey: string;
  startedAt: Date;
  endsAt: Date;
  takeCost: boolean;
}

export const shortLines = (chief: Playthrough, cost: CostLine[]) =>
  cost.filter((line) => ownedCount(chief, line.itemId) < line.amount);

/**
 * Takes the cost out of the stock. A count never goes below 0, because the player can start an
 * upgrade while short.
 */
export const withCostTaken = (
  chief: Playthrough,
  cost: CostLine[],
): Playthrough =>
  withOwnedCounts(
    chief,
    Object.fromEntries(
      cost.map((line) => [
        line.itemId,
        Math.max(0, ownedCount(chief, line.itemId) - line.amount),
      ]),
    ),
  );

export const withConstructionJob = (
  chief: Playthrough,
  job: ConstructionJob,
): Playthrough => ({
  ...chief,
  queues: { ...chief.queues, construction: [...constructionJobs(chief), job] },
});

export const withResearchJob = (
  chief: Playthrough,
  job: ResearchJob,
): Playthrough => ({
  ...chief,
  queues: { ...chief.queues, research: [...researchJobs(chief), job] },
});

export type JobRef =
  | { kind: "construction"; builder: number }
  | { kind: "research"; queue: ResearchQueueId };

const matches = (ref: JobRef, job: ConstructionJob | ResearchJob) =>
  ref.kind === "construction"
    ? "builder" in job && job.builder === ref.builder
    : "queue" in job && job.queue === ref.queue;

const withoutJob = (chief: Playthrough, ref: JobRef): Playthrough => ({
  ...chief,
  queues: {
    ...chief.queues,
    construction:
      ref.kind === "construction"
        ? constructionJobs(chief).filter((job) => !matches(ref, job))
        : constructionJobs(chief),
    research:
      ref.kind === "research"
        ? researchJobs(chief).filter((job) => !matches(ref, job))
        : researchJobs(chief),
  },
});

export const withJobEndsAt = (
  chief: Playthrough,
  ref: JobRef,
  endsAt: string,
): Playthrough => ({
  ...chief,
  queues: {
    ...chief.queues,
    construction: constructionJobs(chief).map((job) =>
      ref.kind === "construction" && matches(ref, job)
        ? { ...job, endsAt }
        : job,
    ),
    research: researchJobs(chief).map((job) =>
      ref.kind === "research" && matches(ref, job) ? { ...job, endsAt } : job,
    ),
  },
});

export const cancelJob = withoutJob;

const withLogEntry = (
  chief: Playthrough,
  entry: UpgradeLogEntry,
): Playthrough => ({
  ...chief,
  upgradeLog: [...(chief.upgradeLog ?? []), entry],
});

/**
 * Finish sets the building to the new level, frees the builder and adds the upgrade to the log.
 * A shelter job names the shelter that was upgraded.
 */
export const finishConstruction = (
  chief: Playthrough,
  job: ConstructionJob,
  at: string,
): Playthrough => {
  const building = findBuildingById(job.buildingId);
  if (!building)
    return withoutJob(chief, { kind: "construction", builder: job.builder });

  const level = building.levels.find((item) => item.label === job.to);
  const previous = building.levels.find((item) => item.label === job.from);
  let updated: Playthrough;
  if (job.instance !== undefined) {
    const levels = shelterLevels(chief.buildings?.[job.buildingId]);
    updated = withShelterLevels(
      chief,
      levels.map((label, index) => (index === job.instance ? job.to : label)),
    );
  } else {
    updated = withLevel(chief, job.buildingId, job.to);
  }

  return withLogEntry(
    withoutJob(updated, { kind: "construction", builder: job.builder }),
    {
      at,
      category: "building",
      item: building.name,
      from: job.from ?? "Not built",
      to: job.to,
      cost: (level?.cost ?? []).flatMap((line) =>
        line.itemId ? [{ itemId: line.itemId, amount: line.count }] : [],
      ),
      power: (level?.power ?? 0) - (previous?.power ?? 0),
    },
  );
};

export const finishResearch = (
  chief: Playthrough,
  job: ResearchJob,
  at: string,
): Playthrough => {
  const node = findResearch(job.nodeId);
  const level = node ? levelData(node, job.to) : undefined;
  const updated = withResearchLevel(chief, job.nodeId, job.to);

  return withLogEntry(
    withoutJob(updated, { kind: "research", queue: job.queue }),
    {
      at,
      category: "research",
      item: node?.name ?? job.nodeId,
      from: String(job.from),
      to: String(job.to),
      cost: level?.cost ?? [],
      power: level?.power ?? 0,
    },
  );
};
