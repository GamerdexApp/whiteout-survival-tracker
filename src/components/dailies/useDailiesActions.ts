import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { updateChiefById } from "@/service/chiefs";
import {
  addRoutineTasks,
  addStarterTask,
  addTask,
  cycleDateAt,
  describeRemoval,
  moveTask,
  readDailies,
  removeTask,
  renameTask,
  resetDailies,
  restoreRemovedTask,
  restoreStarterList,
  setMissionLevel,
  setResetTime,
  setTaskDone,
} from "@/service/dailies";
import type { StarterTaskId } from "@/service/dailies";
import { useToast } from "@/comps/ui/Toast";

export const useDailiesActions = (chief: Playthrough) => {
  const t = useTranslations("dailies.toast");
  const { updateData } = usePlaythrough();
  const showToast = useToast();

  const change = (update: (current: Playthrough) => Playthrough) =>
    updateData((data) => updateChiefById(data, chief.id, update));

  const currentCycle = () =>
    cycleDateAt(Date.now(), readDailies(chief).resetTimeUtc);

  return {
    setLevel: (missionId: string, level: number) => {
      const cycle = currentCycle();
      change((current) => setMissionLevel(current, missionId, level, cycle));
    },
    setDone: (taskId: string, done: boolean) => {
      const cycle = currentCycle();
      change((current) => setTaskDone(current, taskId, done, cycle));
    },
    add: (label: string) =>
      change((current) => addTask(current, label)) !== null,
    rename: (taskId: string, label: string) =>
      change((current) => renameTask(current, taskId, label)),
    move: (taskId: string, step: -1 | 1) =>
      change((current) => moveTask(current, taskId, step)),
    remove: (taskId: string) => {
      const removed = describeRemoval(chief, taskId);
      if (!removed) return false;
      if (!change((current) => removeTask(current, taskId))) return false;
      showToast({
        variant: "warning",
        title: t("removedTitle", { label: removed.task.label }),
        message: t("removedMessage"),
        action: {
          label: t("undo"),
          onAction: () =>
            change((current) => restoreRemovedTask(current, removed)),
        },
      });
      return true;
    },
    addStarter: (starterId: StarterTaskId) =>
      change((current) => addStarterTask(current, starterId)),
    restoreStarter: () => change(restoreStarterList),
    addRoutine: () => change(addRoutineTasks),
    setReset: (resetTime: string) => {
      const nowMs = Date.now();
      change((current) => setResetTime(current, resetTime, nowMs));
    },
    resetNow: () => {
      const before = chief;
      if (!change(resetDailies)) return false;
      showToast({
        variant: "warning",
        title: t("resetTitle"),
        message: t("resetMessage"),
        action: {
          label: t("undo"),
          onAction: () =>
            change((current) => ({ ...current, dailies: before.dailies })),
        },
      });
      return true;
    },
  };
};

export type DailiesActions = ReturnType<typeof useDailiesActions>;
