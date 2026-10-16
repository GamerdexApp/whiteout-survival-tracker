import { translator } from "@/i18n/formatter";
import type { Building } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import {
  entertainmentBuildings,
  furnace,
  levelledBuildings,
  SHELTER_ID,
} from "@/data/game/buildings";
import {
  knownLabel,
  levelAgeLock,
  levelOrder,
  reachableLevel,
  requirementText,
  unmetRequirements,
  withBuilt,
  withLevel,
} from "./buildings";

/**
 * The buildings the Mass edit dialog sets. The Shelter is left out because each shelter has its
 * own level, which the Shelters dialog sets.
 */
export const massSetBuildings = levelledBuildings.filter(
  (building) => building.id !== SHELTER_ID,
);

export interface MassSetDraft {
  levels: Record<string, string | null>;
  built: Record<string, boolean>;
}

export const draftFromChief = (chief: Playthrough): MassSetDraft => ({
  levels: Object.fromEntries(
    massSetBuildings.map((building) => [
      building.id,
      knownLabel(building, chief.buildings?.[building.id]?.level),
    ]),
  ),
  built: Object.fromEntries(
    entertainmentBuildings.map((building) => [
      building.id,
      chief.buildings?.[building.id]?.built === true,
    ]),
  ),
});

export const applyDraft = (chief: Playthrough, draft: MassSetDraft) => {
  const withLevels = massSetBuildings.reduce(
    (current, building) =>
      withLevel(current, building.id, draft.levels[building.id]),
    chief,
  );
  return entertainmentBuildings.reduce(
    (current, building) =>
      withBuilt(current, building.id, draft.built[building.id]),
    withLevels,
  );
};

export interface MassSetChange {
  building: Building;
  from: string | null;
  to: string | null;
}

export const draftChanges = (chief: Playthrough, draft: MassSetDraft) => {
  const built = translator("buildings")("built");
  const levelChanges: MassSetChange[] = massSetBuildings.flatMap((building) => {
    const from = knownLabel(building, chief.buildings?.[building.id]?.level);
    const to = draft.levels[building.id];
    return from === to ? [] : [{ building, from, to }];
  });
  const builtChanges: MassSetChange[] = entertainmentBuildings.flatMap(
    (building) => {
      const from = chief.buildings?.[building.id]?.built === true;
      const to = draft.built[building.id];
      return from === to
        ? []
        : [{ building, from: from ? built : null, to: to ? built : null }];
    },
  );
  return [...levelChanges, ...builtChanges];
};

/**
 * Every level of the Furnace list, which is the longest one. Other buildings use a part of the same
 * label sequence, so a label here ranks a level of any building.
 */
export const rankLabels = furnace.levels.map((level) => level.label);

/**
 * Raises each building to its highest level at or below `label` in the shared sequence. A building
 * that starts later (War Academy starts at FC 1) stays where it is when the label is before its
 * first level. A building that is already higher is never lowered. A level the server age has not
 * unlocked is never chosen.
 */
export const raiseAllTo = (
  chief: Playthrough,
  draft: MassSetDraft,
  label: string,
): MassSetDraft => {
  const rank = levelOrder(furnace, label);
  const levels = { ...draft.levels };

  massSetBuildings.forEach((building) => {
    const target = building.levels
      .filter(
        (level) =>
          levelOrder(furnace, level.label) <= rank &&
          levelAgeLock(chief, level.label) === null,
      )
      .reduce<number>((highest, level) => Math.max(highest, level.order), 0);
    const currentOrder = levelOrder(building, levels[building.id]);
    if (target > currentOrder) {
      levels[building.id] = building.levels.find(
        (level) => level.order === target,
      )!.label;
    }
  });

  return { ...draft, levels };
};

/**
 * The requirements on other tracked buildings that the draft does not meet, for each building the
 * draft changes. A level needs the requirements of every level below it, so the first failing level
 * is reported. A building the draft leaves alone is never reported, because the saved data is the
 * player's own word and must not stop an unrelated change.
 */
export const draftBlockers = (chief: Playthrough, draft: MassSetDraft) => {
  const drafted = applyDraft(chief, draft);
  const changed = new Set(
    draftChanges(chief, draft).map((change) => change.building.id),
  );
  const blockers: Record<string, string[]> = {};

  massSetBuildings.forEach((building) => {
    if (!changed.has(building.id)) return;
    const target = levelOrder(building, draft.levels[building.id]);
    const blocked = building.levels
      .filter((level) => level.order <= target)
      .map((level) => unmetRequirements(building, level, drafted, true))
      .find((unmet) => unmet.length > 0);
    if (blocked) blockers[building.id] = blocked.map(requirementText);
  });

  entertainmentBuildings.forEach((building) => {
    if (!changed.has(building.id) || !draft.built[building.id]) return;
    const unmet = unmetRequirements(
      building,
      building.levels[0],
      drafted,
      true,
    );
    if (unmet.length > 0) blockers[building.id] = unmet.map(requirementText);
  });

  return blockers;
};

const MAX_FIX_PASSES = 30;

/**
 * Lowers every blocked building to the highest level the draft allows. Lowering one building can
 * block another, so it repeats until nothing is blocked.
 */
export const lowerBlocked = (
  chief: Playthrough,
  draft: MassSetDraft,
): MassSetDraft => {
  let current = draft;

  for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
    const blockers = draftBlockers(chief, current);
    if (Object.keys(blockers).length === 0) return current;

    const drafted = applyDraft(chief, current);
    const levels = { ...current.levels };
    const built = { ...current.built };

    massSetBuildings.forEach((building) => {
      if (blockers[building.id]) {
        levels[building.id] = reachableLevel(building, 0, drafted, true);
      }
    });
    entertainmentBuildings.forEach((building) => {
      if (blockers[building.id]) built[building.id] = false;
    });
    current = { levels, built };
  }
  return current;
};
