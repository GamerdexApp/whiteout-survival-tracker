import { translator } from "@/i18n/formatter";
import type { Playthrough, ResearchJob, ResearchQueueId } from "@/types/app";
import { formatNumber, formatTimeLeft } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { findResearch, tabName } from "@/data/game/research";
import type { CostLine, SlotInfo, StartPayload, UpgradeOption } from "./queues";
import {
  queueJob,
  RESEARCH_QUEUES,
  researchJobs,
  researchQueueLabel,
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
): UpgradeOption[] => {
  const t = translator("research");
  return views.flatMap((view) => {
    if (!view.next || !canStartResearch(view, chief)) return [];

    const cost: CostLine[] = view.next.cost.map((line) => ({
      itemId: line.itemId,
      name: findItem(line.itemId)?.name ?? line.itemId,
      amount: line.amount,
    }));
    const from = view.level;
    const to = view.level + 1;
    const range = {
      from: formatNumber(from),
      to: formatNumber(to),
      tab: tabName(view.tab),
    };

    return [
      {
        id: view.node.id,
        label: t("option.label", { name: view.node.name, ...range }),
        name: view.node.name,
        img: view.node.img || undefined,
        subtitle: t("option.subtitle", range),
        cost,
        baseSeconds: view.next.researchTimeSeconds,
        power: view.next.power,
        slotKeys: [view.node.queue],
        from: String(from),
        to: String(to),
      },
    ];
  });
};

export const researchSlots = (chief: Playthrough, now: number): SlotInfo[] => {
  const t = translator("research");
  return RESEARCH_QUEUES.map((queue) => {
    const job = queueJob(chief, queue.id);
    const node = job ? findResearch(job.nodeId) : undefined;
    return {
      key: queue.id,
      label: researchQueueLabel(queue.id),
      busyText: job
        ? t("option.busy", {
            name: node?.name ?? job.nodeId,
            level: formatNumber(job.to),
            timeLeft: formatTimeLeft(secondsLeft(job, now)),
          })
        : undefined,
    };
  });
};

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
