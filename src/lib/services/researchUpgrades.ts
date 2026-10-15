import type { Playthrough, ResearchJob, ResearchQueueId } from "@/types/app";
import { formatTimeLeft } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { findResearch } from "@/data/game/research";
import type { CostLine, SlotInfo, StartPayload, UpgradeOption } from "./queues";
import {
  queueJob,
  RESEARCH_QUEUES,
  researchJobs,
  secondsLeft,
  withCostTaken,
  withResearchJob,
} from "./queues";
import type { ResearchNodeView } from "./research";

export const canStartResearch = (view: ResearchNodeView, chief: Playthrough) =>
  view.next !== undefined &&
  !view.placeholder &&
  view.tabLock === null &&
  view.lockedBy === null &&
  view.blockedBy.length === 0 &&
  view.job === undefined &&
  !researchJobs(chief).some((job) => job.nodeId === view.node.id);

export const researchOptions = (
  views: ResearchNodeView[],
  chief: Playthrough,
): UpgradeOption[] =>
  views.flatMap((view) => {
    if (!view.next || !canStartResearch(view, chief)) return [];

    const cost: CostLine[] = view.next.cost.map((line) => ({
      itemId: line.itemId,
      name: findItem(line.itemId)?.name ?? line.itemId,
      amount: line.amount,
    }));
    const from = view.level;
    const to = view.level + 1;

    return [
      {
        id: view.node.id,
        label: `${view.node.name}, ${view.tab.name}, level ${from} to ${to}`,
        name: view.node.name,
        img: view.node.img || undefined,
        subtitle: `Level ${from} to level ${to}, ${view.tab.name} tab`,
        cost,
        baseSeconds: view.next.researchTimeSeconds,
        power: view.next.power,
        slotKeys: [view.node.queue],
        from: String(from),
        to: String(to),
      },
    ];
  });

export const researchSlots = (chief: Playthrough, now: number): SlotInfo[] =>
  RESEARCH_QUEUES.map((queue) => {
    const job = queueJob(chief, queue.id);
    const node = job ? findResearch(job.nodeId) : undefined;
    return {
      key: queue.id,
      label: `${queue.name}, ${queue.tabs}`,
      busyText: job
        ? `Busy: ${node?.name ?? job.nodeId} level ${job.to}, ${formatTimeLeft(secondsLeft(job, now))}`
        : undefined,
    };
  });

export const startResearch = (
  chief: Playthrough,
  option: UpgradeOption,
  payload: StartPayload,
): Playthrough => {
  const job: ResearchJob = {
    queue: payload.slotKey as ResearchQueueId,
    nodeId: option.id,
    from: Number(option.from),
    to: Number(option.to),
    startedAt: payload.startedAt.toISOString(),
    endsAt: payload.endsAt.toISOString(),
  };
  const started = withResearchJob(chief, job);
  return payload.takeCost ? withCostTaken(started, option.cost) : started;
};
