import { translator } from "@/i18n/formatter";
import type {
  ConstructionJob,
  LearningJobState,
  Playthrough,
  ResearchJob,
  ResearchQueueId,
  TrainingJobState,
  TroopId,
  UpgradeJob,
  UpgradeLogEntry,
} from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import { findResearch, levelData } from "@/data/game/research";
import { shelterLevels, withLevel, withShelterLevels } from "./buildings";
import { applyExpertChange, buildExpertViews } from "./experts";
import { ownedCount, withOwnedCounts } from "./inventory";
import { withResearchLevel } from "./research";
import { buildTroopViews, countOf, withTroopCount } from "./troops";

export const BUILDER_NUMBERS = [1, 2] as const;
export const RESEARCH_QUEUES: { id: ResearchQueueId }[] = [
  { id: "main" },
  { id: "warAcademy" },
];

export const researchQueueLabel = (queue: ResearchQueueId) => {
  const t = translator("queues");
  return t("researchQueues.label", {
    name: t(`researchQueues.${queue}.name`),
    tabs: t(`researchQueues.${queue}.tabs`),
  });
};

const SECOND_MS = 1_000;
const MINUTE_SECONDS = 60;

export const constructionJobs = (chief: Playthrough): ConstructionJob[] =>
  chief.queues?.construction ?? [];

export const researchJobs = (chief: Playthrough): ResearchJob[] =>
  chief.queues?.research ?? [];

export const trainingJobs = (chief: Playthrough): TrainingJobState[] =>
  chief.queues?.training ?? [];

export const learningJobs = (chief: Playthrough): LearningJobState[] =>
  chief.queues?.learning ?? [];

/** One learning session runs at a time, so the queue holds at most one job. */
export const learningJob = (chief: Playthrough) => learningJobs(chief)[0];

export const campJob = (chief: Playthrough, camp: TroopId) =>
  trainingJobs(chief).find((job) => job.camp === camp);

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

export const withTrainingJob = (
  chief: Playthrough,
  job: TrainingJobState,
): Playthrough => ({
  ...chief,
  queues: { ...chief.queues, training: [...trainingJobs(chief), job] },
});

export const withLearningJob = (
  chief: Playthrough,
  job: LearningJobState,
): Playthrough => ({
  ...chief,
  queues: { ...chief.queues, learning: [job] },
});

export type JobRef =
  | { kind: "construction"; builder: number }
  | { kind: "research"; queue: ResearchQueueId }
  | { kind: "training"; camp: TroopId }
  | { kind: "learning" };

const matches = (
  ref: JobRef,
  job: ConstructionJob | ResearchJob | TrainingJobState | LearningJobState,
) => {
  if (ref.kind === "learning") return "expertId" in job;
  if (ref.kind === "construction")
    return "builder" in job && job.builder === ref.builder;
  if (ref.kind === "research") return "queue" in job && job.queue === ref.queue;
  return "camp" in job && job.camp === ref.camp;
};

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
    training:
      ref.kind === "training"
        ? trainingJobs(chief).filter((job) => !matches(ref, job))
        : trainingJobs(chief),
    learning:
      ref.kind === "learning"
        ? learningJobs(chief).filter((job) => !matches(ref, job))
        : learningJobs(chief),
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
    training: trainingJobs(chief).map((job) =>
      ref.kind === "training" && matches(ref, job) ? { ...job, endsAt } : job,
    ),
    learning: learningJobs(chief).map((job) =>
      ref.kind === "learning" && matches(ref, job) ? { ...job, endsAt } : job,
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

/**
 * Finish adds the troops to the saved counts, frees the camp and adds the batch to the log. A
 * promotion takes the troops from the lower tier, and a count never goes below 0.
 */
export const finishTraining = (
  chief: Playthrough,
  job: TrainingJobState,
  at: string,
): Playthrough => {
  const view = buildTroopViews(chief).find((item) => item.id === job.camp);
  const targetTier = job.mode === "training" ? job.tier : job.toTier;
  if (!view || targetTier === undefined)
    return withoutJob(chief, { kind: "training", camp: job.camp });

  const unitPower = (tier: number | undefined) =>
    view.tiers.find((item) => item.tier === tier)?.unitPower ?? 0;
  const before = countOf(chief, job.camp, targetTier);

  let updated = withTroopCount(chief, job.camp, targetTier, before + job.count);
  if (job.mode === "promotion" && job.fromTier !== undefined) {
    updated = withTroopCount(
      updated,
      job.camp,
      job.fromTier,
      Math.max(0, countOf(chief, job.camp, job.fromTier) - job.count),
    );
  }

  const tierText =
    job.mode === "training"
      ? `T${job.tier}`
      : `T${job.fromTier} to T${job.toTier}`;
  const power =
    job.mode === "training"
      ? job.count * unitPower(job.tier)
      : job.count * (unitPower(job.toTier) - unitPower(job.fromTier));

  return withLogEntry(
    withoutJob(updated, { kind: "training", camp: job.camp }),
    {
      at,
      category: "training",
      item: `${view.name} ${tierText}`, // i18n-ignore
      from: String(before),
      to: String(before + job.count),
      cost: job.cost ?? [],
      power,
    },
  );
};

/**
 * Finish adds the EXP of the session to the skill, up to the EXP that the skill can still use, and
 * frees the learning queue. The log keeps the held EXP before and after.
 */
export const finishLearning = (
  chief: Playthrough,
  job: LearningJobState,
  at: string,
): Playthrough => {
  const view = buildExpertViews(chief).find(
    (item) => item.expert.id === job.expertId,
  );
  const skill = view?.expert.skills[job.skillIndex];
  if (!view || !skill) return withoutJob(chief, { kind: "learning" });

  const before = view.skillExp[job.skillIndex];
  const updated = applyExpertChange(chief, {
    kind: "skillExp",
    expertId: job.expertId,
    index: job.skillIndex,
    exp: before + job.exp,
  });
  const after =
    buildExpertViews(updated).find((item) => item.expert.id === job.expertId)
      ?.skillExp[job.skillIndex] ?? before;

  return withLogEntry(withoutJob(updated, { kind: "learning" }), {
    at,
    category: "learning",
    item: `${view.expert.name} ${skill.name}`, // i18n-ignore
    from: String(before),
    to: String(after),
    cost: [],
    power: 0,
  });
};
