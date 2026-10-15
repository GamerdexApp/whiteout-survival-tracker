import { translator } from "@/i18n/formatter";
import { calculateHeroGear } from "whiteout-survival-data";
import type { HeroGearCalculation } from "whiteout-survival-data";
import type {
  HeroGearGoal,
  HeroGearPiece,
  HeroGearQuality,
  HeroGearSet,
  HeroGearSlot,
  Playthrough,
  TroopType,
} from "@/types/app";
import { formatNumber } from "@/lib/format";
import { findHero } from "@/data/game/heroes";
import {
  DEFAULT_QUALITY,
  EMPOWERMENT_FORGING_INDEX,
  forgingIndex,
  forgingRows,
  gearQualityIds,
  gearSlots,
  MAX_EMPOWERMENT,
  MAX_ENHANCEMENT,
  statEntry,
  troopTypes,
} from "@/data/game/heroGear";
import { findItem } from "@/data/game/items";
import { ownedCount } from "./inventory";
import type { StockCheck } from "./planStock";

export const slotIds = gearSlots.map((slot) => slot.id as HeroGearSlot);

export const emptyPiece = (
  quality: HeroGearQuality = DEFAULT_QUALITY,
): HeroGearPiece => ({
  quality,
  enhancement: 0,
  empowerment: 0,
  forging: null,
});

export const qualityOf = (piece: HeroGearPiece) =>
  piece.quality ?? DEFAULT_QUALITY;

/**
 * Mastery forging and empowerment exist for Mythic gear only. Lower qualities can only be
 * enhanced.
 */
export const isMythic = (piece: HeroGearPiece) =>
  qualityOf(piece) === DEFAULT_QUALITY;

const clamp = (value: number, max: number) =>
  Math.min(max, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));

const knownForging = (id: string | null | undefined) =>
  forgingIndex(id ?? null) >= 0 ? (id as string) : null;

const knownQuality = (quality: string | undefined): HeroGearQuality =>
  gearQualityIds.some((id) => id === quality)
    ? (quality as HeroGearQuality)
    : DEFAULT_QUALITY;

const normalizedPiece = (
  piece: Partial<HeroGearPiece> | undefined,
): HeroGearPiece => {
  const quality = knownQuality(piece?.quality);
  const mythic = quality === DEFAULT_QUALITY;
  return {
    quality,
    enhancement: clamp(piece?.enhancement ?? 0, MAX_ENHANCEMENT),
    empowerment: mythic ? clamp(piece?.empowerment ?? 0, MAX_EMPOWERMENT) : 0,
    forging: mythic ? knownForging(piece?.forging) : null,
  };
};

export const gearSetsOf = (chief: Playthrough): HeroGearSet[] =>
  (chief.heroGear?.sets ?? []).map((set) => ({
    ...set,
    pieces: Object.fromEntries(
      slotIds.map((slot) => [slot, normalizedPiece(set.pieces?.[slot])]),
    ) as HeroGearSet["pieces"],
  }));

export const findGearSet = (chief: Playthrough, setId: string) =>
  gearSetsOf(chief).find((set) => set.id === setId);

export const hasForgingForEmpowerment = (forging: string | null) =>
  forgingIndex(forging) >= EMPOWERMENT_FORGING_INDEX;

export const isEmpowermentReady = (piece: HeroGearPiece) =>
  isMythic(piece) &&
  piece.enhancement === MAX_ENHANCEMENT &&
  hasForgingForEmpowerment(piece.forging);

export interface EmpowermentLock {
  needsMythic: boolean;
  needsEnhancement: boolean;
  needsForging: boolean;
}

export const empowermentLock = (
  piece: HeroGearPiece,
): EmpowermentLock | null => {
  const needsMythic = !isMythic(piece);
  const needsEnhancement = piece.enhancement < MAX_ENHANCEMENT;
  const needsForging = !hasForgingForEmpowerment(piece.forging);
  return needsMythic || needsEnhancement || needsForging
    ? { needsMythic, needsEnhancement, needsForging }
    : null;
};

export const lockText = (lock: EmpowermentLock) => {
  const t = translator("heroGear");
  if (lock.needsMythic) return t("lock.needsMythic");
  if (lock.needsEnhancement && lock.needsForging) return t("lock.needsBoth");
  return lock.needsEnhancement
    ? t("lock.needsEnhancement")
    : t("lock.needsForging");
};

/**
 * Mastery forging past level 10 needs enhancement 100.
 */
export const forgingLimitIndex = (enhancement: number) =>
  enhancement < MAX_ENHANCEMENT
    ? EMPOWERMENT_FORGING_INDEX
    : forgingRows.length - 1;

/**
 * A piece that is empowered, or forged past level 10, must keep enhancement 100.
 */
export const enhancementFloor = (piece: HeroGearPiece) =>
  piece.empowerment > 0 ||
  forgingIndex(piece.forging) > EMPOWERMENT_FORGING_INDEX
    ? MAX_ENHANCEMENT
    : 0;

export const forgingFloorIndex = (piece: HeroGearPiece) =>
  piece.empowerment > 0 ? EMPOWERMENT_FORGING_INDEX : -1;

export const withPieceChange = (
  chief: Playthrough,
  setId: string,
  slot: HeroGearSlot,
  patch: Partial<HeroGearPiece>,
): Playthrough => ({
  ...chief,
  heroGear: {
    sets: gearSetsOf(chief).map((set) =>
      set.id === setId
        ? {
            ...set,
            pieces: {
              ...set.pieces,
              [slot]: { ...set.pieces[slot], ...patch },
            },
          }
        : set,
    ),
  },
});

export const nextSetName = (sets: HeroGearSet[]) =>
  translator("heroGear")("defaultSetName", {
    number: formatNumber(sets.length + 1),
  });

export interface NewSetValues {
  name: string;
  troopType: TroopType;
  quality: HeroGearQuality;
  heroId: string | null;
  copyFromId: string | null;
}

export const withAddedSet = (
  chief: Playthrough,
  values: NewSetValues,
  id: string,
): Playthrough => {
  const sets = gearSetsOf(chief);
  const source = sets.find((set) => set.id === values.copyFromId);
  const pieces = Object.fromEntries(
    slotIds.map((slot) => [
      slot,
      source ? { ...source.pieces[slot] } : emptyPiece(values.quality),
    ]),
  ) as HeroGearSet["pieces"];
  return {
    ...chief,
    heroGear: {
      sets: [
        ...sets,
        {
          id,
          name: values.name.trim(),
          troopType: values.troopType,
          ...(values.heroId ? { heroId: values.heroId } : {}),
          pieces,
        },
      ],
    },
  };
};

export interface EditedSetValues {
  name: string;
  heroId: string | null;
}

export const withEditedSet = (
  chief: Playthrough,
  setId: string,
  values: EditedSetValues,
): Playthrough => ({
  ...chief,
  heroGear: {
    sets: gearSetsOf(chief).map((set) => {
      if (set.id !== setId) return set;
      const { heroId: _previous, ...rest } = set;
      return {
        ...rest,
        name: values.name.trim(),
        ...(values.heroId ? { heroId: values.heroId } : {}),
      };
    }),
  },
});

/**
 * Gear below Mythic cannot be forged or empowered, so a change to a lower quality clears both,
 * with their goals in the plan.
 */
export const withPieceQuality = (
  chief: Playthrough,
  setId: string,
  slot: HeroGearSlot,
  quality: HeroGearQuality,
): Playthrough => {
  const changed = withPieceChange(
    chief,
    setId,
    slot,
    quality === DEFAULT_QUALITY
      ? { quality }
      : { quality, forging: null, empowerment: 0 },
  );
  const plan = changed.heroGearPlan;
  const goal = plan?.goals?.[setId]?.[slot];
  if (quality === DEFAULT_QUALITY || !plan || !goal) return changed;

  const { forging: _forging, empowerment: _empowerment, ...kept } = goal;
  return {
    ...changed,
    heroGearPlan: {
      ...plan,
      goals: { ...plan.goals, [setId]: { ...plan.goals[setId], [slot]: kept } },
    },
  };
};

export const withDeletedSet = (
  chief: Playthrough,
  setId: string,
): Playthrough => {
  const goals = Object.fromEntries(
    Object.entries(chief.heroGearPlan?.goals ?? {}).filter(
      ([id]) => id !== setId,
    ),
  );
  return {
    ...chief,
    heroGear: { sets: gearSetsOf(chief).filter((set) => set.id !== setId) },
    heroGearPlan: chief.heroGearPlan
      ? {
          ...chief.heroGearPlan,
          rows: chief.heroGearPlan.rows.filter((row) => row.setId !== setId),
          goals,
        }
      : undefined,
  };
};

const forgingGoal = (piece: HeroGearPiece, goal: HeroGearGoal | undefined) =>
  goal?.forging !== undefined &&
  forgingIndex(goal.forging) > forgingIndex(piece.forging)
    ? goal.forging
    : piece.forging;

/**
 * The goal of a piece, never below the current value. A goal that was saved and has since been
 * passed by the current value reads as the current value.
 */
export const resolvedGoal = (
  piece: HeroGearPiece,
  goal: HeroGearGoal | undefined,
): HeroGearPiece =>
  isMythic(piece)
    ? {
        quality: qualityOf(piece),
        enhancement: Math.max(piece.enhancement, goal?.enhancement ?? 0),
        empowerment: Math.max(piece.empowerment, goal?.empowerment ?? 0),
        forging: forgingGoal(piece, goal),
      }
    : {
        quality: qualityOf(piece),
        enhancement: Math.max(piece.enhancement, goal?.enhancement ?? 0),
        empowerment: 0,
        forging: null,
      };

/**
 * Brings a goal in line with the rules of the page: forging past level 10 needs an enhancement
 * goal of 100, and empowerment needs both enhancement 100 and forging level 10.
 */
export const normalizedGoal = (
  piece: HeroGearPiece,
  goal: HeroGearPiece,
): HeroGearPiece => {
  if (!isMythic(piece)) return { ...piece, enhancement: goal.enhancement };
  const forging =
    forgingIndex(goal.forging) > forgingLimitIndex(goal.enhancement)
      ? forgingRows[forgingLimitIndex(goal.enhancement)].id
      : goal.forging;
  const unlocked =
    goal.enhancement === MAX_ENHANCEMENT && hasForgingForEmpowerment(forging);
  return {
    enhancement: goal.enhancement,
    forging:
      forgingIndex(forging) < forgingIndex(piece.forging)
        ? piece.forging
        : forging,
    empowerment: unlocked ? goal.empowerment : piece.empowerment,
  };
};

export const hasPieceGoal = (piece: HeroGearPiece, goal: HeroGearPiece) =>
  goal.enhancement > piece.enhancement ||
  goal.empowerment > piece.empowerment ||
  forgingIndex(goal.forging) > forgingIndex(piece.forging);

export const runPiece = (
  troopType: TroopType,
  slot: HeroGearSlot,
  piece: HeroGearPiece,
  goal: HeroGearPiece,
) =>
  calculateHeroGear({
    quality: qualityOf(piece),
    piece: { slot, troopType },
    masteryForging:
      goal.forging === null
        ? undefined
        : { current: piece.forging, goal: goal.forging },
    enhancement: { current: piece.enhancement, goal: goal.enhancement },
    empowerment: { current: piece.empowerment, goal: goal.empowerment },
  });

export interface PieceStats {
  power: number;
  combatStat: number;
  health: number;
  percentStat: number;
  combatStatName: string;
  percentStatName: string;
}

/**
 * The stats and power of a piece as it stands. The calculator holds the rules for forging and
 * rounding, so a plan with no change reads them.
 */
export const pieceStats = (
  troopType: TroopType,
  slot: HeroGearSlot,
  piece: HeroGearPiece,
): PieceStats | null => {
  const result = runPiece(troopType, slot, piece, piece);
  if (!result.stats) return null;
  return {
    power: result.currentPower,
    ...result.stats.current,
    combatStatName: result.stats.combatStatName,
    percentStatName: result.stats.percentStatName,
  };
};

/**
 * The power of the four pieces of a set, as each piece stands.
 */
export const setPower = (set: HeroGearSet) =>
  slotIds.reduce(
    (total, slot) =>
      total + (pieceStats(set.troopType, slot, set.pieces[slot])?.power ?? 0),
    0,
  );

export interface MilestoneReached {
  empowermentLevel: number;
  stat: string;
}

export const milestonesReached = (
  troopType: TroopType,
  slot: HeroGearSlot,
  piece: HeroGearPiece,
): MilestoneReached[] =>
  (statEntry(slot, troopType)?.milestones ?? []).filter(
    (milestone) => milestone.empowermentLevel <= piece.empowerment,
  );

export interface GearSummary {
  sets: number;
  atEnhancementMax: number;
  empowered: number;
  readyForEmpowerment: number;
  pieces: number;
}

export const summarizeGear = (sets: HeroGearSet[]): GearSummary => {
  const pieces = sets.flatMap((set) => slotIds.map((slot) => set.pieces[slot]));
  return {
    sets: sets.length,
    pieces: pieces.length,
    atEnhancementMax: pieces.filter(
      (piece) => piece.enhancement === MAX_ENHANCEMENT,
    ).length,
    empowered: pieces.filter((piece) => piece.empowerment > 0).length,
    readyForEmpowerment: pieces.filter(isEmpowermentReady).length,
  };
};

export const enhancementLine = (set: HeroGearSet) =>
  slotIds.map((slot) => set.pieces[slot].enhancement).join(" · ");

export const troopLabel = (troopType: TroopType) =>
  translator("heroGear")(`troop.${troopType}`);

export const allTroopTypes: readonly TroopType[] = troopTypes;

export interface PlanPieceRef {
  setId: string;
  slot: HeroGearSlot;
}

export interface PlanPieceGoal {
  ref: PlanPieceRef;
  set: HeroGearSet;
  piece: HeroGearPiece;
  goal: HeroGearPiece;
}

export type PlanGoals = Record<
  string,
  Partial<Record<HeroGearSlot, HeroGearPiece>>
>;

export const initialPlanRefs = (chief: Playthrough): PlanPieceRef[] => {
  const saved = chief.heroGearPlan;
  const sets = gearSetsOf(chief);
  const fromGoals = sets.flatMap((set) =>
    slotIds.flatMap((slot) =>
      hasPieceGoal(
        set.pieces[slot],
        resolvedGoal(set.pieces[slot], saved?.goals?.[set.id]?.[slot]),
      )
        ? [{ setId: set.id, slot }]
        : [],
    ),
  );
  const savedRows = (saved?.rows ?? []).filter((row) =>
    sets.some((set) => set.id === row.setId),
  );
  const seen = new Set<string>();
  return [...savedRows, ...fromGoals].filter((ref) => {
    const key = `${ref.setId}/${ref.slot}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const initialPlanGoals = (chief: Playthrough): PlanGoals =>
  Object.fromEntries(
    gearSetsOf(chief).map((set) => [
      set.id,
      Object.fromEntries(
        slotIds.map((slot) => [
          slot,
          resolvedGoal(
            set.pieces[slot],
            chief.heroGearPlan?.goals?.[set.id]?.[slot],
          ),
        ]),
      ),
    ]),
  );

export const withSavedGearPlan = (
  chief: Playthrough,
  refs: PlanPieceRef[],
  goals: PlanGoals,
  savedAt: string,
): Playthrough => ({
  ...chief,
  heroGearPlan: {
    rows: refs,
    goals: Object.fromEntries(
      Object.entries(goals).map(([setId, bySlot]) => [
        setId,
        Object.fromEntries(
          Object.entries(bySlot).map(([slot, goal]) => [
            slot,
            {
              enhancement: goal.enhancement,
              empowerment: goal.empowerment,
              forging: goal.forging,
            },
          ]),
        ),
      ]),
    ),
    savedAt,
  },
});

export interface GearPlanRow extends PlanPieceGoal {
  calculation: HeroGearCalculation;
}

export interface GearPlanResult {
  rows: GearPlanRow[];
  resources: Map<string, number>;
  power: number;
  currentPower: number;
  goalPower: number;
  eventPoints: {
    svs: number;
    allianceShowdown: number;
    kingOfIcefield: number;
  };
  milestones: { label: string; stat: string }[];
}

export const runGearPlan = (
  chief: Playthrough,
  refs: PlanPieceRef[],
  goals: PlanGoals,
): GearPlanResult => {
  const t = translator("heroGear");
  const sets = gearSetsOf(chief);
  const rows = refs.flatMap((ref) => {
    const set = sets.find((item) => item.id === ref.setId);
    if (!set) return [];
    const piece = set.pieces[ref.slot];
    const goal = resolvedGoal(piece, goals[ref.setId]?.[ref.slot]);
    return [
      {
        ref,
        set,
        piece,
        goal,
        calculation: runPiece(set.troopType, ref.slot, piece, goal),
      },
    ];
  });

  const resources = new Map<string, number>();
  rows.forEach(({ calculation }) =>
    calculation.resources.forEach(({ itemId, amount }) =>
      resources.set(itemId, (resources.get(itemId) ?? 0) + amount),
    ),
  );
  const sum = (pick: (row: GearPlanRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  return {
    rows,
    resources,
    power: sum((row) => row.calculation.power),
    currentPower: sum((row) => row.calculation.currentPower),
    goalPower: sum((row) => row.calculation.goalPower),
    eventPoints: {
      svs: sum((row) => row.calculation.eventPoints.svs),
      allianceShowdown: sum(
        (row) => row.calculation.eventPoints.allianceShowdown,
      ),
      kingOfIcefield: sum((row) => row.calculation.eventPoints.kingOfIcefield),
    },
    milestones: rows.flatMap((row) =>
      (row.calculation.stats?.milestones ?? []).map((milestone) => ({
        label: t("plan.pieceTitle", {
          set: row.set.name,
          slot: slotName(row.ref.slot),
        }),
        stat: t("plan.milestone", {
          level: formatNumber(milestone.empowermentLevel),
          event: milestone.event,
          stat: milestone.stat,
        }),
      })),
    ),
  };
};

export const slotName = (slot: HeroGearSlot) =>
  gearSlots.find((item) => item.id === slot)?.name ?? slot;

export const gearPlanChecks = (
  plan: GearPlanResult,
  chief: Playthrough,
): StockCheck[] =>
  [...plan.resources.entries()].map(([itemId, needed]) => ({
    id: itemId,
    name: findItem(itemId)?.name ?? itemId,
    available: ownedCount(chief, itemId),
    needed,
  }));

export type GearHeroFilter = "all" | "linked" | "unlinked";
export type GearSetOrder = "created" | "name" | "power" | "hero";

export interface GearSetFilters {
  search: string;
  troopType: TroopType | "all";
  hero: GearHeroFilter;
  order: GearSetOrder;
}

export const defaultGearSetFilters = (): GearSetFilters => ({
  search: "",
  troopType: "all",
  hero: "all",
  order: "power",
});

export const countGearSetFilters = (filters: GearSetFilters) =>
  [
    filters.troopType !== "all",
    filters.hero !== "all",
    filters.order !== "power",
  ].filter(Boolean).length;

const heroNameOf = (set: HeroGearSet) =>
  (set.heroId && findHero(set.heroId)?.name) || "";

const gearOrderCompare: Record<
  Exclude<GearSetOrder, "created">,
  (a: HeroGearSet, b: HeroGearSet) => number
> = {
  name: (a, b) => a.name.localeCompare(b.name),
  power: (a, b) => setPower(b) - setPower(a),
  hero: (a, b) => {
    const [nameA, nameB] = [heroNameOf(a), heroNameOf(b)];
    if (nameA === "" || nameB === "")
      return Number(nameA === "") - Number(nameB === "");
    return nameA.localeCompare(nameB);
  },
};

/**
 * Created order is the order the sets are saved in. Every other order falls back to the name.
 */
export const filterGearSets = (
  sets: HeroGearSet[],
  filters: GearSetFilters,
) => {
  const text = filters.search.trim().toLowerCase();
  const matching = sets.filter(
    (set) =>
      (text === "" ||
        set.name.toLowerCase().includes(text) ||
        set.troopType.includes(text) ||
        heroNameOf(set).toLowerCase().includes(text)) &&
      (filters.troopType === "all" || set.troopType === filters.troopType) &&
      (filters.hero === "all" ||
        (filters.hero === "linked") === (set.heroId !== undefined)),
  );
  if (filters.order === "created") return matching;
  const compare = gearOrderCompare[filters.order];
  return [...matching].sort(
    (a, b) => compare(a, b) || a.name.localeCompare(b.name),
  );
};
