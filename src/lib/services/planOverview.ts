import { translator } from "@/i18n/formatter";
import type { CoreEventId, GeneralSpeedupUse, Playthrough } from "@/types/app";
import { findBuildingById } from "@/data/game/buildings";
import { findResearch } from "@/data/game/research";
import { allTroops } from "@/data/game/troops";
import {
  beastPlanScores,
  exportSpecOf as beastSpecOf,
  initialBeastPlan,
  runBeastPlan,
} from "./beasts";
import {
  constructionSpeedBonusPercent,
  researchSpeedBonusPercent,
} from "./bonuses";
import { exportSpecOf as buildingSpecOf } from "./buildingExport";
import {
  constructionSpeedPercent,
  defaultPlanControls,
  initialPlanRows,
  runPlan,
} from "./buildingPlan";
import { exportSpecOf as charmSpecOf } from "./chiefCharmExport";
import {
  initialGoalMap,
  itemsOf,
  ladderChecks,
  runItemPlan,
} from "./chiefGear";
import type { LadderKind } from "./chiefGear";
import { exportSpecOf as gearSpecOf } from "./chiefGearExport";
import { BASE_RESOURCE_IDS } from "./coreResources";
import { earnablePointsOf, withEachLineOnItsOwnDay } from "./eventExport";
import type { ExportSpec } from "./eventExport";
import { exportSpecOf as expertSpecOf } from "./expertExport";
import {
  expertPlanChecks,
  initialExpertGoals,
  powerGainOf,
  runExpertsPlan,
} from "./experts";
import {
  effectiveLuckyWheel,
  heroPlanChecks,
  initialHeroGoals,
  runHeroPlan,
} from "./heroes";
import { exportSpecOf as heroSpecOf } from "./heroExport";
import {
  gearPlanChecks,
  initialPlanGoals,
  initialPlanRefs,
  runGearPlan,
  slotName,
} from "./heroGear";
import { exportSpecOf as heroGearSpecOf } from "./heroGearExport";
import {
  generalMinutesApplied,
  generalSharePercent,
  ownedCount,
} from "./inventory";
import { exportSpecOf as petSpecOf } from "./petExport";
import {
  initialPetGoals,
  petPlanChecks,
  petSkillConstructionPercent,
  runPetPlan,
} from "./pets";
import { itemChecks, researchChecks, resourceChecks } from "./planStock";
import type { StockCheck } from "./planStock";
import { exportSpecOf as researchSpecOf } from "./researchExport";
import {
  defaultResearchControls,
  initialResearchRows,
  runResearchPlan,
} from "./researchPlan";
import { exportSpecOf as troopSpecOf } from "./troopExport";
import {
  draftOfSavedPlan,
  runTroopsPlan,
  troopsStockChecks,
} from "./troopsPlan";

export const PLAN_IDS = [
  "buildings",
  "research",
  "troops",
  "experts",
  "pets",
  "heroes",
  "heroGear",
  "chiefGear",
  "chiefCharms",
  "beasts",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type QueueId = "construction" | "research" | "training" | "learning";

export const QUEUE_IDS: QueueId[] = [
  "construction",
  "research",
  "training",
  "learning",
];

/** The page of each plan. Beasts has none and opens its flyout on the overview. */
export const PLAN_HREF: Partial<Record<PlanId, string>> = {
  buildings: "/buildings",
  research: "/research",
  troops: "/troops",
  experts: "/experts",
  pets: "/pets",
  heroes: "/heroes",
  heroGear: "/heroes?tab=gear",
  chiefGear: "/chief-gear",
  chiefCharms: "/chief-gear?tab=charms",
};

export type EventPoints = Record<CoreEventId, number>;

export interface PlanSummary {
  id: PlanId;
  /** The stock checks of the plan, as its own page shows them. */
  checks: StockCheck[];
  /** What the plan changes, such as the building or the expert names. */
  what: string[];
  queue: QueueId | null;
  seconds: number;
  /** Null while the data has no power for a part of the plan. */
  power: number | null;
  points: EventPoints;
}

const beastsScore = (chief: Playthrough) =>
  chief.beastPlan !== undefined &&
  beastPlanScores(
    initialBeastPlan(chief),
    runBeastPlan(initialBeastPlan(chief), chief),
  );

/**
 * The plans that hold goals to work on. A plan whose goals sit at the current levels is left out.
 */
export const availablePlanIds = (chief: Playthrough): PlanId[] => {
  const hasGoal = (kind: LadderKind) => {
    const items = itemsOf(kind, chief);
    const goals = initialGoalMap(items);
    return items.some((item) => goals[item.key] !== item.current);
  };
  const available: Record<PlanId, boolean> = {
    buildings: initialPlanRows(chief).length > 0,
    research: initialResearchRows(chief).length > 0,
    troops: draftOfSavedPlan(chief).runs.length > 0,
    experts: Object.keys(initialExpertGoals(chief)).length > 0,
    pets: Object.keys(initialPetGoals(chief)).length > 0,
    heroes: Object.keys(initialHeroGoals(chief)).length > 0,
    heroGear: initialPlanRefs(chief).length > 0,
    chiefGear: hasGoal("gear"),
    chiefCharms: hasGoal("charm"),
    beasts: beastsScore(chief),
  };
  return PLAN_IDS.filter((id) => available[id]);
};

const pointsOf = (chief: Playthrough, spec: ExportSpec): EventPoints => {
  const points: EventPoints = { svs: 0, showdown: 0, king: 0, hall: 0 };
  earnablePointsOf(chief, spec).forEach((entry) => {
    points[entry.event] = entry.total;
  });
  return points;
};

const rangeText = (from: string, to: string) =>
  translator("buildings")("levelRange", { from, to });

export interface OverviewOptions {
  /** The Bonuses switch of the calculators: whether the speed from the Bonuses page counts. */
  useBonuses: boolean;
}

const buildings = (
  chief: Playthrough,
  { useBonuses }: OverviewOptions,
): PlanSummary => {
  const rows = initialPlanRows(chief);
  const speed = constructionSpeedPercent(
    defaultPlanControls(chief),
    petSkillConstructionPercent(chief),
    useBonuses ? constructionSpeedBonusPercent(chief) : 0,
  );
  const calculation = runPlan(rows, chief, speed);
  return {
    id: "buildings",
    checks: resourceChecks(calculation, chief),
    what: rows.map((row) => {
      const name = findBuildingById(row.id)?.name ?? row.id;
      return `${name} ${row.current ? rangeText(row.current, row.goal) : row.goal}`;
    }),
    queue: "construction",
    seconds: calculation.seconds,
    power: calculation.power,
    points: pointsOf(chief, buildingSpecOf(chief, calculation)),
  };
};

const research = (
  chief: Playthrough,
  { useBonuses }: OverviewOptions,
): PlanSummary => {
  const rows = initialResearchRows(chief);
  const calculation = runResearchPlan(
    rows,
    chief,
    defaultResearchControls(chief),
    useBonuses ? researchSpeedBonusPercent(chief) : 0,
  );
  return {
    id: "research",
    checks: researchChecks(calculation, chief),
    what: rows.map((row) => {
      const name = findResearch(row.id)?.name ?? row.id;
      return `${name} ${rangeText(String(row.current), String(row.goal))}`;
    }),
    queue: "research",
    seconds: calculation.seconds,
    power: calculation.power,
    points: pointsOf(chief, researchSpecOf(rows, calculation)),
  };
};

const troops = (chief: Playthrough): PlanSummary => {
  const draft = draftOfSavedPlan(chief);
  const result = runTroopsPlan(chief, draft);
  const nameOf = (camp: string) =>
    allTroops.find((troop) => troop.id === camp)?.name ?? camp;
  return {
    id: "troops",
    checks: troopsStockChecks(chief, result),
    what: draft.runs.map((run) =>
      run.mode === "training"
        ? `${nameOf(run.camp)} T${run.tier ?? 1}`
        : `${nameOf(run.camp)} ${rangeText(`T${run.fromTier ?? 1}`, `T${run.toTier ?? 2}`)}`,
    ),
    queue: "training",
    seconds: result.calculation.longestCampSeconds,
    power: result.calculation.totalPower.total,
    points: pointsOf(
      chief,
      withEachLineOnItsOwnDay(troopSpecOf(draft, result)),
    ),
  };
};

const experts = (chief: Playthrough): PlanSummary => {
  const plan = runExpertsPlan(chief, initialExpertGoals(chief));
  return {
    id: "experts",
    checks: expertPlanChecks(plan, chief),
    what: plan.rows.map((row) => row.view.expert.name),
    queue: "learning",
    seconds: plan.total.learningMinutes * 60,
    power: powerGainOf(plan),
    points: pointsOf(chief, expertSpecOf(plan, chief)),
  };
};

const pets = (chief: Playthrough): PlanSummary => {
  const plan = runPetPlan(chief, initialPetGoals(chief));
  return {
    id: "pets",
    checks: petPlanChecks(plan, chief),
    what: plan.rows.map((row) => row.view.pet.name),
    queue: null,
    seconds: 0,
    power: plan.totalPower,
    points: pointsOf(chief, petSpecOf(plan, chief)),
  };
};

const heroes = (chief: Playthrough): PlanSummary => {
  const goals = initialHeroGoals(chief);
  const saved = chief.heroesPlan?.luckyWheel ?? {
    heroId: "",
    spins: 0,
    tokens: ownedCount(chief, "lucky-chip"),
  };
  const plan = runHeroPlan(
    chief,
    goals,
    effectiveLuckyWheel(chief, goals, saved),
  );
  return {
    id: "heroes",
    checks: heroPlanChecks(plan, chief),
    what: plan.rows.map((row) => row.view.hero.name),
    queue: null,
    seconds: 0,
    power: plan.powerGain,
    points: pointsOf(chief, heroSpecOf(plan)),
  };
};

const heroGear = (chief: Playthrough): PlanSummary => {
  const plan = runGearPlan(
    chief,
    initialPlanRefs(chief),
    initialPlanGoals(chief),
  );
  const t = translator("heroGear");
  return {
    id: "heroGear",
    checks: gearPlanChecks(plan, chief),
    what: plan.rows.map((row) =>
      t("plan.pieceTitle", { set: row.set.name, slot: slotName(row.ref.slot) }),
    ),
    queue: null,
    seconds: 0,
    power: plan.power,
    points: pointsOf(chief, heroGearSpecOf(plan)),
  };
};

const ladder =
  (id: "chiefGear" | "chiefCharms", kind: LadderKind) =>
  (chief: Playthrough): PlanSummary => {
    const items = itemsOf(kind, chief);
    const plan = runItemPlan(items, initialGoalMap(items));
    return {
      id,
      checks: ladderChecks(plan.total.materials, chief, kind),
      what: plan.byItem.map((entry) => entry.item.label),
      queue: null,
      seconds: 0,
      power: plan.total.power,
      points: pointsOf(
        chief,
        kind === "gear" ? gearSpecOf(plan) : charmSpecOf(plan),
      ),
    };
  };

const beasts = (chief: Playthrough): PlanSummary => {
  const plan = initialBeastPlan(chief);
  const spec = beastSpecOf(plan, runBeastPlan(plan, chief));
  return {
    id: "beasts",
    checks: [],
    what: spec.groups.flatMap((group) => group.lines.map((line) => line.label)),
    queue: null,
    seconds: 0,
    power: 0,
    points: pointsOf(chief, spec),
  };
};

const summarizers: Record<
  PlanId,
  (chief: Playthrough, options: OverviewOptions) => PlanSummary
> = {
  buildings,
  research,
  troops,
  experts,
  pets,
  heroes,
  heroGear,
  chiefGear: ladder("chiefGear", "gear"),
  chiefCharms: ladder("chiefCharms", "charm"),
  beasts,
};

/**
 * The summary of each plan that holds goals. A plan that the calculator rejects is left out of the
 * overview and stays on its own page.
 */
export const summarizePlans = (
  chief: Playthrough,
  options: OverviewOptions,
): PlanSummary[] =>
  availablePlanIds(chief).flatMap((id) => {
    try {
      return [summarizers[id](chief, options)];
    } catch {
      return [];
    }
  });

export type OverviewGroupId = "base" | "crystals" | "speedups" | "other";

export interface OverviewRow {
  id: string;
  name: string;
  needed: number;
  available: number;
  /** The unit of the amounts, such as minutes for a speedup row. */
  unit?: string;
  /** A line under the name, such as where the stock comes from. */
  detail?: string;
  parts: { plan: PlanId; amount: number }[];
}

export interface OverviewGroup {
  id: OverviewGroupId;
  rows: OverviewRow[];
}

export interface PlanOverview {
  plans: PlanSummary[];
  groups: OverviewGroup[];
  itemCount: number;
  shortCount: number;
  power: number;
  /** The plans whose power is not known, which the total leaves out. */
  unknownPower: PlanId[];
  points: EventPoints;
  queues: { id: QueueId; seconds: number }[];
  longestSeconds: number;
}

const GENERAL_SPEEDUP_ROW = "general-speedups";

/** The plans that draw on the general speedups, and the share setting of each. */
const GENERAL_USE: Partial<Record<PlanId, GeneralSpeedupUse>> = {
  buildings: "buildings",
  research: "research",
  troops: "troops",
  experts: "experts",
};

const CRYSTAL_IDS = [
  "steel",
  "fire-crystal",
  "refined-fire-crystal",
  "fire-crystal-shard",
];

const groupOf = (check: StockCheck): OverviewGroupId => {
  if (check.unit !== undefined) return "speedups";
  if ((BASE_RESOURCE_IDS as readonly string[]).includes(check.id))
    return "base";
  return CRYSTAL_IDS.includes(check.id) ? "crystals" : "other";
};

const orderIn = (ids: readonly string[], id: string) => {
  const index = ids.indexOf(id);
  return index === -1 ? ids.length : index;
};

/**
 * Adds the plans together. The base resources and any item that two plans need are summed and
 * checked once against the stock, so the packs and chests go to the whole overview. An item that
 * one plan needs keeps the stock check of its own page. A speedup row keeps the share that its
 * plan sets for the general speedups.
 */
export const overviewOf = (
  chief: Playthrough,
  summaries: PlanSummary[],
  off: readonly PlanId[],
): PlanOverview => {
  const plans = summaries.filter((summary) => !off.includes(summary.id));
  const needers = new Map<string, { plan: PlanId; check: StockCheck }[]>();
  const general = {
    needed: 0,
    available: 0,
    parts: [] as OverviewRow["parts"],
  };
  plans.forEach((plan) =>
    plan.checks
      .filter((check) => check.needed > 0)
      .forEach((check) => {
        const use = GENERAL_USE[plan.id];
        const split =
          use !== undefined &&
          check.unit !== undefined &&
          generalSharePercent(chief, use) > 0;
        const share = split ? generalMinutesApplied(chief, use) : 0;
        const dedicated = check.available - share;
        const counted = split
          ? {
              ...check,
              needed: Math.min(check.needed, dedicated),
              available: dedicated,
            }
          : check;
        const overflow = split ? Math.max(0, check.needed - dedicated) : 0;
        general.available += share;
        general.needed += overflow;
        if (overflow > 0)
          general.parts.push({ plan: plan.id, amount: overflow });
        if (counted.needed > 0)
          needers.set(check.id, [
            ...(needers.get(check.id) ?? []),
            { plan: plan.id, check: counted },
          ]);
      }),
  );

  const summed = [...needers.entries()]
    .filter(
      ([id, list]) =>
        list[0].check.unit === undefined &&
        (list.length > 1 ||
          (BASE_RESOURCE_IDS as readonly string[]).includes(id)),
    )
    .map(([id, list]) => ({
      itemId: id,
      amount: list.reduce((sum, { check }) => sum + check.needed, 0),
    }));
  const combined = new Map(
    itemChecks(summed, chief).map((check) => [check.id, check]),
  );

  const rows = [...needers.entries()].map(([id, list]) => {
    const own = combined.get(id) ?? list[0].check;
    const row: OverviewRow = {
      id,
      name: list[0].check.name,
      needed: own.needed,
      available: own.available,
      unit: list[0].check.unit,
      detail: own.detail,
      parts: list.map(({ plan, check }) => ({ plan, amount: check.needed })),
    };
    return { row, group: groupOf(list[0].check) };
  });

  if (general.needed > 0)
    rows.push({
      row: {
        id: GENERAL_SPEEDUP_ROW,
        name: translator("planOverview")("resources.generalSpeedups"),
        needed: general.needed,
        available: general.available,
        unit: translator("resources")("planStock.minutesUnit"),
        parts: general.parts,
      },
      group: "speedups",
    });

  const groups = (["base", "crystals", "speedups", "other"] as const).map(
    (id): OverviewGroup => ({
      id,
      rows: rows
        .filter((entry) => entry.group === id)
        .map((entry) => entry.row)
        .sort((a, b) =>
          id === "base"
            ? orderIn(BASE_RESOURCE_IDS, a.id) -
              orderIn(BASE_RESOURCE_IDS, b.id)
            : id === "crystals"
              ? orderIn(CRYSTAL_IDS, a.id) - orderIn(CRYSTAL_IDS, b.id)
              : 0,
        ),
    }),
  );
  const all = groups.flatMap((group) => group.rows);

  const points: EventPoints = { svs: 0, showdown: 0, king: 0, hall: 0 };
  plans.forEach((plan) =>
    (Object.keys(points) as CoreEventId[]).forEach((event) => {
      points[event] += plan.points[event];
    }),
  );
  const queues = QUEUE_IDS.flatMap((id) => {
    const seconds = plans
      .filter((plan) => plan.queue === id)
      .reduce((longest, plan) => Math.max(longest, plan.seconds), 0);
    return seconds > 0 ? [{ id, seconds }] : [];
  });

  return {
    plans,
    groups,
    itemCount: all.length,
    shortCount: all.filter((row) => row.needed > row.available).length,
    power: plans.reduce((sum, plan) => sum + (plan.power ?? 0), 0),
    unknownPower: plans
      .filter((plan) => plan.power === null)
      .map((plan) => plan.id),
    points,
    queues,
    longestSeconds: queues.reduce(
      (longest, queue) => Math.max(longest, queue.seconds),
      0,
    ),
  };
};
