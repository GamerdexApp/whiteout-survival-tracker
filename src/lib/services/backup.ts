import { translator } from "@/i18n/formatter";
import type {
  AppData,
  CoreEventId,
  Playthrough,
  Settings,
  Theme,
} from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
  allCoreEventIds,
  DEFAULT_HERO_GENERATION,
  MAX_HERO_GENERATION,
} from "@/data/chief";

type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

const themes: Theme[] = ["light", "dark", "system"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const parseChief = (value: unknown, position: number): Playthrough | string => {
  const t = translator("settings");
  const values = { position: formatNumber(position) };
  if (!isRecord(value)) return t("backup.chief.notObject", values);
  if (!isNonEmptyString(value.id)) return t("backup.chief.noId", values);
  if (!isNonEmptyString(value.name)) return t("backup.chief.noName", values);
  if (
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.lastModified)
  ) {
    return t("backup.chief.noDates", values);
  }
  if (value.stateNumber !== undefined && !Number.isInteger(value.stateNumber)) {
    return t("backup.chief.badStateNumber", values);
  }
  if (value.coreEventsShown !== undefined) {
    const valid =
      Array.isArray(value.coreEventsShown) &&
      value.coreEventsShown.every((id) =>
        allCoreEventIds.includes(id as CoreEventId),
      );
    if (!valid) return t("backup.chief.badCoreEvent", values);
  }

  const generation = value.heroGenerationUnlocked;
  const generationIsValid =
    Number.isInteger(generation) &&
    (generation as number) >= 0 &&
    (generation as number) <= MAX_HERO_GENERATION;

  return {
    ...value,
    heroGenerationUnlocked: generationIsValid
      ? (generation as number)
      : DEFAULT_HERO_GENERATION,
  } as unknown as Playthrough;
};

const parseSettings = (value: unknown): Settings | string => {
  const t = translator("settings");
  if (!isRecord(value)) return t("backup.settings.notObject");
  if (value.theme !== undefined && !themes.includes(value.theme as Theme)) {
    return t("backup.settings.badTheme");
  }
  for (const key of ["language", "numberFormat", "dateFormat"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "string") {
      return t("backup.settings.notText", { key });
    }
  }
  if (value.ui !== undefined && !isRecord(value.ui))
    return t("backup.settings.uiNotObject");
  return value as Settings;
};

/**
 * Checks a whole backup file. Nothing is saved by this function. Unknown fields are kept so a
 * file from a later version of the app loads unchanged.
 */
export const parseBackup = (text: string): ParseResult => {
  const t = translator("settings");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: t("backup.notJson"),
    };
  }

  if (!isRecord(raw) || !Array.isArray(raw.playthroughs)) {
    return {
      ok: false,
      error: t("backup.noChiefsList"),
    };
  }

  const playthroughs: Playthrough[] = [];
  for (const [index, value] of raw.playthroughs.entries()) {
    const chief = parseChief(value, index + 1);
    if (typeof chief === "string")
      return {
        ok: false,
        error: t("backup.withNothingChanged", { reason: chief }),
      };
    playthroughs.push(chief);
  }

  if (
    new Set(playthroughs.map((chief) => chief.id)).size !== playthroughs.length
  ) {
    return {
      ok: false,
      error: t("backup.duplicateId"),
    };
  }

  let settings: Settings | undefined;
  if (raw.settings !== undefined) {
    const parsed = parseSettings(raw.settings);
    if (typeof parsed === "string")
      return {
        ok: false,
        error: t("backup.withNothingChanged", { reason: parsed }),
      };
    settings = parsed;
  }

  const requestedActive =
    typeof raw.activePlaythroughId === "string"
      ? raw.activePlaythroughId
      : null;
  const activePlaythroughId = playthroughs.some(
    (chief) => chief.id === requestedActive,
  )
    ? requestedActive
    : (playthroughs[0]?.id ?? null);

  return {
    ok: true,
    data: { playthroughs, activePlaythroughId, ...(settings && { settings }) },
  };
};

export type ImportMode = "merge" | "replace";

export type ImportRowResult =
  "added" | "updated" | "kept" | "replaced" | "removed";

export interface ImportRow {
  name: string;
  fileModified?: string;
  deviceModified?: string;
  result: ImportRowResult;
}

export const planImport = (
  current: AppData,
  incoming: AppData,
  mode: ImportMode,
): ImportRow[] => {
  const onDevice = new Map(
    current.playthroughs.map((chief) => [chief.id, chief]),
  );

  const rows: ImportRow[] = incoming.playthroughs.map((chief) => {
    const existing = onDevice.get(chief.id);
    const base = { name: chief.name, fileModified: chief.lastModified };
    if (mode === "replace") {
      return {
        ...base,
        deviceModified: existing?.lastModified,
        result: "replaced",
      };
    }
    if (!existing) return { ...base, result: "added" };
    const fileIsNewer = chief.lastModified > existing.lastModified;
    return {
      ...base,
      deviceModified: existing.lastModified,
      result: fileIsNewer ? "updated" : "kept",
    };
  });

  const incomingIds = new Set(incoming.playthroughs.map((chief) => chief.id));
  current.playthroughs
    .filter((chief) => !incomingIds.has(chief.id))
    .forEach((chief) =>
      rows.push({
        name: chief.name,
        deviceModified: chief.lastModified,
        result: mode === "replace" ? "removed" : "kept",
      }),
    );
  return rows;
};

export const applyImport = (
  current: AppData,
  incoming: AppData,
  mode: ImportMode,
): AppData => {
  if (mode === "replace") return incoming;

  const incomingById = new Map(
    incoming.playthroughs.map((chief) => [chief.id, chief]),
  );
  const merged = current.playthroughs.map((chief) => {
    const fromFile = incomingById.get(chief.id);
    return fromFile && fromFile.lastModified > chief.lastModified
      ? fromFile
      : chief;
  });
  const knownIds = new Set(current.playthroughs.map((chief) => chief.id));
  const added = incoming.playthroughs.filter(
    (chief) => !knownIds.has(chief.id),
  );
  const playthroughs = [...merged, ...added];

  const settings = current.settings ?? incoming.settings;
  const activeStillExists = playthroughs.some(
    (chief) => chief.id === current.activePlaythroughId,
  );

  return {
    playthroughs,
    activePlaythroughId: activeStillExists
      ? current.activePlaythroughId
      : (playthroughs[0]?.id ?? null),
    ...(settings && { settings }),
  };
};

export const summarizeImport = (rows: ImportRow[]) => {
  const t = translator("settings");
  const count = (result: ImportRowResult) =>
    rows.filter((row) => row.result === result).length;
  const results = ["added", "updated", "kept", "replaced", "removed"] as const;
  return results
    .map((result) => ({ result, amount: count(result) }))
    .filter(({ amount }) => amount > 0)
    .map(({ result, amount }) =>
      t(`backup.summary.${result}`, { amount: formatNumber(amount) }),
    )
    .join(", ");
};

export const backupFileName = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `whiteout-survival-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
};

export const downloadBackup = (data: AppData) => {
  const fileName = backupFileName();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
};
