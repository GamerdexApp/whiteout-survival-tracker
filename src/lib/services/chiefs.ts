import { translator } from "@/i18n/formatter";
import type { AppData, ChiefValues, Playthrough } from "@/types/app";
import { formatFurnaceShort } from "@/lib/format";
import { constructionPackOf } from "./queues";

export const emptyAppData = (): AppData => ({
  playthroughs: [],
  activePlaythroughId: null,
});

const nowIso = () => new Date().toISOString();

const byLastModifiedDesc = (a: Playthrough, b: Playthrough) =>
  b.lastModified.localeCompare(a.lastModified);

export const addChief = (data: AppData, values: ChiefValues): AppData => {
  const now = nowIso();
  const chief: Playthrough = {
    ...values,
    id: crypto.randomUUID(),
    createdAt: now,
    lastModified: now,
  };
  return {
    ...data,
    playthroughs: [...data.playthroughs, chief],
    activePlaythroughId: chief.id,
  };
};

export const updateChief = (
  data: AppData,
  id: string,
  values: ChiefValues,
): AppData => ({
  ...data,
  playthroughs: data.playthroughs.map((chief) =>
    chief.id === id ? { ...chief, ...values, lastModified: nowIso() } : chief,
  ),
});

export const removeChief = (data: AppData, id: string): AppData => {
  const remaining = data.playthroughs.filter((chief) => chief.id !== id);
  const activeStillExists = remaining.some(
    (chief) => chief.id === data.activePlaythroughId,
  );
  const nextActive = activeStillExists
    ? data.activePlaythroughId
    : ([...remaining].sort(byLastModifiedDesc)[0]?.id ?? null);
  return { ...data, playthroughs: remaining, activePlaythroughId: nextActive };
};

export const restoreChief = (
  data: AppData,
  chief: Playthrough,
  wasActive: boolean,
): AppData => {
  if (data.playthroughs.some((existing) => existing.id === chief.id))
    return data;
  return {
    ...data,
    playthroughs: [...data.playthroughs, chief],
    activePlaythroughId: wasActive ? chief.id : data.activePlaythroughId,
  };
};

export const toChiefValues = (chief: Playthrough): ChiefValues => ({
  name: chief.name,
  stateNumber: chief.stateNumber,
  serverStartDate: chief.serverStartDate,
  heroGenerationUnlocked: chief.heroGenerationUnlocked,
  coreEventsShown: chief.coreEventsShown ?? ["svs", "showdown", "king", "hall"],
  unlockOverrides: chief.unlockOverrides,
  marchQueuePack: chief.marchQueuePack,
  constructionPack: constructionPackOf(chief),
  notes: chief.notes,
});

export const describeChief = (
  chief: Playthrough,
  fullFurnaceLabels = false,
) => {
  const t = translator("chiefs");
  const furnaceLevel = chief.buildings?.furnace?.level;
  const parts = [
    furnaceLevel ? formatFurnaceShort(furnaceLevel, fullFurnaceLabels) : null,
    chief.stateNumber === undefined
      ? null
      : t("describe.state", { number: String(chief.stateNumber) }),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : t("describe.empty");
};

export { formatShortDate } from "@/i18n/formatter";

export const updateChiefById = (
  data: AppData,
  id: string,
  change: (chief: Playthrough) => Playthrough,
): AppData => ({
  ...data,
  playthroughs: data.playthroughs.map((chief) =>
    chief.id === id ? { ...change(chief), lastModified: nowIso() } : chief,
  ),
});
