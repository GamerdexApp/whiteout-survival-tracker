import type { BuildingLevel } from "whiteout-survival-data";
import type { ConstructionJob, Playthrough } from "@/types/app";
import { formatTimeLeft } from "@/lib/format";
import { findBuildingById, shelter, SHELTER_ID } from "@/data/game/buildings";
import type { BuildingView } from "./buildings";
import { findLevel, levelOrder, shelterLevels } from "./buildings";
import type { CostLine, SlotInfo, StartPayload, UpgradeOption } from "./queues";
import {
  BUILDER_NUMBERS,
  builderJob,
  buildingJob,
  secondsLeft,
  withConstructionJob,
  withCostTaken,
} from "./queues";

const costOf = (level: BuildingLevel): CostLine[] =>
  level.cost.flatMap((line) =>
    line.itemId
      ? [{ itemId: line.itemId, name: line.name, amount: line.count }]
      : [],
  );

/**
 * The shelter that an upgrade raises is the lowest one, the next to upgrade. The job keeps its
 * position, so Finish raises the same shelter.
 */
export const shelterInstanceToUpgrade = (chief: Playthrough) => {
  const held = shelterLevels(chief.buildings?.[SHELTER_ID]);
  let lowest: number | undefined;
  held.forEach((label, index) => {
    if (
      lowest === undefined ||
      levelOrder(shelter, label) < levelOrder(shelter, held[lowest])
    ) {
      lowest = index;
    }
  });
  return lowest;
};

export const canStartUpgrade = (view: BuildingView, chief: Playthrough) =>
  view.next !== undefined &&
  view.lockedBy === null &&
  view.blockedBy.length === 0 &&
  buildingJob(chief, view.building.id) === undefined;

export const upgradeOptions = (
  views: BuildingView[],
  chief: Playthrough,
): UpgradeOption[] =>
  views.flatMap((view) => {
    if (!view.next || !canStartUpgrade(view, chief)) return [];

    const isShelter = view.building.id === SHELTER_ID;
    const instance = isShelter ? shelterInstanceToUpgrade(chief) : undefined;
    const held = isShelter ? shelterLevels(chief.buildings?.[SHELTER_ID]) : [];
    const from = instance === undefined ? view.level : held[instance];
    const subject =
      instance === undefined ? view.building.name : `Shelter ${instance + 1}`;
    const current = findLevel(view.building, from);

    return [
      {
        id: view.building.id,
        label: `${subject}, ${from ?? "Not built"} to ${view.next.label}`,
        name: subject,
        img: view.building.img,
        subtitle: `${from ?? "Not built"} to ${view.next.label}`,
        cost: costOf(view.next),
        baseSeconds: view.next.buildTimeSeconds,
        power: view.next.power - (current?.power ?? 0),
        slotKeys: BUILDER_NUMBERS.map(String),
        from,
        to: view.next.label,
        ...(instance === undefined ? {} : { instance }),
      },
    ];
  });

export const builderSlots = (chief: Playthrough, now: number): SlotInfo[] =>
  BUILDER_NUMBERS.map((builder) => {
    const job = builderJob(chief, builder);
    return {
      key: String(builder),
      label: `Builder ${builder}`,
      busyText: job
        ? `Busy: ${findBuildingById(job.buildingId)?.name ?? job.buildingId} to ${job.to}, ${formatTimeLeft(secondsLeft(job, now))}`
        : undefined,
    };
  });

export const startConstruction = (
  chief: Playthrough,
  option: UpgradeOption,
  payload: StartPayload,
): Playthrough => {
  const job: ConstructionJob = {
    builder: Number(payload.slotKey) as 1 | 2,
    buildingId: option.id,
    from: option.from,
    to: option.to,
    ...(option.instance === undefined ? {} : { instance: option.instance }),
    startedAt: payload.startedAt.toISOString(),
    endsAt: payload.endsAt.toISOString(),
  };
  const started = withConstructionJob(chief, job);
  return payload.takeCost ? withCostTaken(started, option.cost) : started;
};
