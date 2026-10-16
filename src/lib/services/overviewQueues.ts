import type {
  Playthrough,
  ResearchQueueId,
  TroopId,
  UpgradeJob,
} from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import { findResearch } from "@/data/game/research";
import { buildExpertViews } from "./experts";
import {
  BUILDER_NUMBERS,
  builderJob,
  campJob,
  learningJob,
  queueJob,
  RESEARCH_QUEUES,
  secondsLeft,
} from "./queues";
import { buildTroopViews, TROOP_IDS } from "./troops";

export type QueueRowKind =
  "construction" | "research" | "training" | "learning";

export interface QueueRow {
  key: string;
  kind: QueueRowKind;
  slot: number | ResearchQueueId | TroopId | null;
  job: UpgradeJob | undefined;
  /** The thing being upgraded, as package data. */
  subject: string | undefined;
  /** The level reached when the job finishes, as the page shows it. */
  target: string | undefined;
  href: string;
}

const constructionRow = (chief: Playthrough, builder: number): QueueRow => {
  const job = builderJob(chief, builder);
  return {
    key: `construction-${builder}`,
    kind: "construction",
    slot: builder,
    job,
    subject: job && findBuildingById(job.buildingId)?.name,
    target: job?.to,
    href: "/buildings",
  };
};

const researchRow = (chief: Playthrough, queue: ResearchQueueId): QueueRow => {
  const job = queueJob(chief, queue);
  return {
    key: `research-${queue}`,
    kind: "research",
    slot: queue,
    job,
    subject: job && findResearch(job.nodeId)?.name,
    target: job && String(job.to),
    href: "/research",
  };
};

const trainingRows = (chief: Playthrough): QueueRow[] => {
  const views = buildTroopViews(chief);
  return TROOP_IDS.flatMap((camp) => {
    const job = campJob(chief, camp);
    if (!job) return [];
    const tier =
      job.mode === "training"
        ? `T${job.tier}`
        : `T${job.fromTier} to T${job.toTier}`;
    return [
      {
        key: `training-${camp}`,
        kind: "training" as const,
        slot: camp,
        job,
        subject: views.find((view) => view.id === camp)?.name,
        target: tier,
        href: "/troops",
      },
    ];
  });
};

const learningRows = (chief: Playthrough): QueueRow[] => {
  const job = learningJob(chief);
  if (!job) return [];
  const view = buildExpertViews(chief).find(
    (item) => item.expert.id === job.expertId,
  );
  return [
    {
      key: "learning",
      kind: "learning",
      slot: null,
      job,
      subject: view?.expert.name,
      target: view?.expert.skills[job.skillIndex]?.name,
      href: "/experts",
    },
  ];
};

export const constructionRowsOf = (chief: Playthrough) =>
  BUILDER_NUMBERS.map((builder) => constructionRow(chief, builder));

export const researchRowsOf = (chief: Playthrough) =>
  RESEARCH_QUEUES.map((queue) => researchRow(chief, queue.id));

/** Camp batches and the expert learning session show only while they run. */
export const runningExtraRowsOf = (chief: Playthrough): QueueRow[] => [
  ...trainingRows(chief),
  ...learningRows(chief),
];

export const queueRowsOf = (chief: Playthrough): QueueRow[] => [
  ...constructionRowsOf(chief),
  ...researchRowsOf(chief),
  ...runningExtraRowsOf(chief),
];

export const runningCountOf = (rows: QueueRow[]) =>
  rows.filter((row) => row.job).length;

export interface RunningQueue {
  row: QueueRow;
  seconds: number;
}

export interface ResearchTileState {
  running: RunningQueue[];
  idle: QueueRow[];
}

export const researchTileOf = (
  chief: Playthrough,
  now: number,
): ResearchTileState => {
  const rows = researchRowsOf(chief);
  return {
    running: rows
      .flatMap((row) =>
        row.job ? [{ row, seconds: secondsLeft(row.job, now) }] : [],
      )
      .sort((a, b) => a.seconds - b.seconds),
    idle: rows.filter((row) => !row.job),
  };
};
