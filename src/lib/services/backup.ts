import type {
  AppData,
  CoreEventId,
  Playthrough,
  Settings,
  Theme,
} from "@/types/app";
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
  const label = `Chief ${position}`;
  if (!isRecord(value)) return `${label} is not an object.`;
  if (!isNonEmptyString(value.id)) return `${label} has no id.`;
  if (!isNonEmptyString(value.name)) return `${label} has no name.`;
  if (
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.lastModified)
  ) {
    return `${label} is missing its dates.`;
  }
  if (value.stateNumber !== undefined && !Number.isInteger(value.stateNumber)) {
    return `${label} has a state number that is not a whole number.`;
  }
  if (value.coreEventsShown !== undefined) {
    const valid =
      Array.isArray(value.coreEventsShown) &&
      value.coreEventsShown.every((id) =>
        allCoreEventIds.includes(id as CoreEventId),
      );
    if (!valid) return `${label} has an unknown Core event.`;
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
  if (!isRecord(value)) return "The settings are not an object.";
  if (value.theme !== undefined && !themes.includes(value.theme as Theme)) {
    return "The theme is not Light, Dark or System.";
  }
  if (value.ui !== undefined && !isRecord(value.ui))
    return "The interface settings are not an object.";
  return value as Settings;
};

/**
 * Checks a whole backup file. Nothing is saved by this function. Unknown fields are kept so a
 * file from a later version of the app loads unchanged.
 */
export const parseBackup = (text: string): ParseResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "The file is not valid JSON. Nothing was changed.",
    };
  }

  if (!isRecord(raw) || !Array.isArray(raw.playthroughs)) {
    return {
      ok: false,
      error: "The chiefs list is missing. Nothing was changed.",
    };
  }

  const playthroughs: Playthrough[] = [];
  for (const [index, value] of raw.playthroughs.entries()) {
    const chief = parseChief(value, index + 1);
    if (typeof chief === "string")
      return { ok: false, error: `${chief} Nothing was changed.` };
    playthroughs.push(chief);
  }

  if (
    new Set(playthroughs.map((chief) => chief.id)).size !== playthroughs.length
  ) {
    return {
      ok: false,
      error: "Two chiefs share one id. Nothing was changed.",
    };
  }

  let settings: Settings | undefined;
  if (raw.settings !== undefined) {
    const parsed = parseSettings(raw.settings);
    if (typeof parsed === "string")
      return { ok: false, error: `${parsed} Nothing was changed.` };
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
  const count = (result: ImportRowResult) =>
    rows.filter((row) => row.result === result).length;
  const parts = [
    [count("added"), "added"],
    [count("updated"), "updated from the file"],
    [count("kept"), "kept as on this device"],
    [count("replaced"), "loaded from the file"],
    [count("removed"), "removed"],
  ] as const;
  return parts
    .filter(([amount]) => amount > 0)
    .map(([amount, label]) => `${amount} ${label}`)
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
