import { describe, expect, it } from "vitest";
import type { BuildingCalculation } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import { exportSpecOf as buildingSpecOf } from "@/service/buildingExport";
import { earnablePointsOf } from "@/service/eventExport";
import {
  expertPlanScores,
  exportSpecOf as expertSpecOf,
} from "@/service/expertExport";
import { runExpertsPlan } from "@/service/experts";
import { runHeroPlan } from "@/service/heroes";
import { exportSpecOf as heroSpecOf } from "@/service/heroExport";
import { exportSpecOf as petSpecOf } from "@/service/petExport";
import type { PetPlanResult } from "@/service/pets";
import {
  hasExportLines,
  exportSpecOf as troopSpecOf,
} from "@/service/troopExport";
import { newRun, runTroopsPlan } from "@/service/troopsPlan";
import type { TroopsPlanDraft } from "@/service/troopsPlan";
import { emptyChief, veteranChief, withInventory } from "./fixtures";

const matches = (
  line: { matches: (event: never, action: string) => boolean },
  action: string,
) => line.matches("svs" as never, action);

describe("expert export", () => {
  const chief: Playthrough = withInventory(
    {
      ...veteranChief(),
      experts: {
        cyrille: {
          recruited: true,
          affinity: 40,
          advanced: true,
          skills: [3, 0, 0, 0],
        },
      },
    },
    { "speedup-learning-1h": 3 },
  );
  const plan = runExpertsPlan(chief, {
    cyrille: { affinity: 40, advanced: true, skills: [6, 0, 0, 0] },
  });

  it("puts the books, the sigils and the learning speedup minutes on one event day", () => {
    const spec = expertSpecOf(plan, chief);

    expect(spec.groups).toHaveLength(1);
    expect(spec.groups[0].lines.map((line) => line.id)).toEqual([
      "books",
      "sigils",
      "learning-speedups",
    ]);
  });

  it("exports the learning minutes the chief holds, up to what the plan needs", () => {
    const line = expertSpecOf(plan, chief).groups[0].lines[2];

    expect(line.units).toBe(180);
    expect(
      matches(
        line,
        "Use 1m of Speedups to Learn Expert Skills (Gems Speedups excluded)",
      ),
    ).toBe(true);
    expect(matches(line, "Use 1m of Speedups for Research")).toBe(false);
  });

  it("scores when only speedup minutes are in the plan", () => {
    const speedupOnly = runExpertsPlan(chief, {
      cyrille: { affinity: 40, advanced: true, skills: [3, 0, 0, 0] },
    });

    expect(expertPlanScores(speedupOnly, chief)).toBe(false);
    expect(expertPlanScores(plan, chief)).toBe(true);
  });
});

describe("hero export", () => {
  const chief: Playthrough = {
    ...emptyChief(),
    heroGenerationUnlocked: 2,
    heroes: { eugene: { owned: true, star: 0 } },
  };
  const goals = { eugene: { star: 1, tier: 2 } };

  it("puts the lucky wheel spins on the same event day as the hero shards", () => {
    const plan = runHeroPlan(chief, goals, {
      heroId: "eugene",
      spins: 20,
      tokens: 0,
    });
    const shards = heroSpecOf(plan).groups.find(
      (group) => group.id === "shards",
    )!;
    const wheel = shards.lines.find((line) => line.id === "lucky-wheel")!;

    expect(wheel.units).toBe(20);
    expect(wheel.detail).toBe("Eugene");
    expect(matches(wheel, "Play Lucky Wheel 1 times")).toBe(true);
    expect(matches(wheel, "Play Lucky Wheel 1 time")).toBe(true);
    expect(shards.lines.some((line) => line.id.startsWith("shards-"))).toBe(
      true,
    );
  });

  it("leaves the lucky wheel line out when no spins are planned", () => {
    const plan = runHeroPlan(chief, goals, {
      heroId: "eugene",
      spins: 0,
      tokens: 0,
    });
    const shards = heroSpecOf(plan).groups.find(
      (group) => group.id === "shards",
    )!;

    expect(shards.lines.some((line) => line.id === "lucky-wheel")).toBe(false);
  });
});

describe("troop export", () => {
  const chief = withInventory(veteranChief(), {
    "speedup-troop-1h": 2,
  });
  const draft: TroopsPlanDraft = {
    runs: [newRun(chief, "infantry", "training")],
    position: "none",
    rank: "regular",
    capacityBoost: false,
    mobilize: false,
    advancedTraining: false,
  };

  it("puts the troops trained and the speedup minutes on one event day", () => {
    const spec = troopSpecOf(draft, runTroopsPlan(chief, draft));

    expect(spec.groups).toHaveLength(1);
    expect(spec.groups[0].id).toBe("trained");
    expect(hasExportLines(spec)).toBe(true);
  });

  it("lists a line for the troops of each trained tier and for the speedup minutes", () => {
    const result = runTroopsPlan(chief, draft);
    const ids = troopSpecOf(draft, result).groups[0].lines.map(
      (line) => line.id,
    );

    expect(ids.some((id) => id.startsWith("train-"))).toBe(true);
    expect(ids.includes("speedup-minutes")).toBe(result.speedupMinutesUsed > 0);
  });

  it("has nothing to export for an empty plan", () => {
    const empty = { ...draft, runs: [] };

    expect(
      hasExportLines(troopSpecOf(empty, runTroopsPlan(chief, empty))),
    ).toBe(false);
  });
});

describe("earnable event points", () => {
  const spec = (books: number, sigils: number, minutes: number) => ({
    page: "experts",
    groups: [
      {
        id: "items",
        lines: [
          {
            id: "books",
            label: "Books",
            units: books,
            matches: (_event: unknown, action: string) =>
              action === "Use 1 Book of Knowledge",
          },
          {
            id: "sigils",
            label: "Sigils",
            units: sigils,
            matches: (_event: unknown, action: string) =>
              action === "Use any 1 Expert Sigil (excluding Common Sigils)",
          },
          {
            id: "speedups",
            label: "Speedups",
            units: minutes,
            matches: (_event: unknown, action: string) =>
              action.startsWith("Use 1m of Speedups to Learn Expert Skills"),
          },
        ],
      },
    ],
  });

  it("picks the SvS day that scores books, sigils and speedups together", () => {
    const svs = earnablePointsOf(emptyChief(), spec(2, 1, 10)).find(
      (item) => item.event === "svs",
    )!;

    expect(svs.days[0].dayName).toBe("Basic Skills Up");
    expect(svs.total).toBe(2 * 60 + 6000 + 10 * 30);
    expect(svs.days[0].lines.map((item) => item.line.id)).toEqual([
      "books",
      "sigils",
      "speedups",
    ]);
  });

  it("scores the other events the same way and leaves out events with no row", () => {
    const events = earnablePointsOf(emptyChief(), spec(2, 1, 10));
    const showdown = events.find((item) => item.event === "showdown")!;

    expect(showdown.total).toBe(2 * 36 + 3600 + 10 * 18);
    expect(events.map((item) => item.event)).toEqual(["svs", "showdown"]);
  });

  it("lists no event when the plan has nothing to spend", () => {
    expect(earnablePointsOf(emptyChief(), spec(0, 0, 0))).toEqual([]);
  });
});

describe("pet plan event points", () => {
  it("count the Wild Marks held, as if all were used, with the advancement score", () => {
    const chief = withInventory(veteranChief(), {
      "common-wild-mark": 4,
      "advanced-wild-mark": 2,
    });
    const spec = petSpecOf(
      { total: { advancementScore: 100 } } as unknown as PetPlanResult,
      chief,
    );
    const svs = earnablePointsOf(chief, spec).find(
      (item) => item.event === "svs",
    )!;

    expect(svs.total).toBe(100 * 50 + 4 * 1150 + 2 * 15000);
    expect(svs.days[0].lines.map((item) => item.line.id)).toEqual([
      "advancement",
      "commonMark",
      "advancedMark",
    ]);
  });
});

describe("buildings plan event points", () => {
  const calculation = {
    resources: [{ itemId: "fire-crystal", amount: 100 }],
    speedupMinutesNeeded: 5000,
    power: 1000,
    steps: [],
  } as unknown as BuildingCalculation;

  it("scores the crystals and the construction speedups that the chief holds", () => {
    const chief = withInventory(veteranChief(), {
      "fire-crystal": 40,
      "speedup-construction-1h": 50,
    });
    const svs = earnablePointsOf(
      chief,
      buildingSpecOf(chief, calculation),
    ).find((item) => item.event === "svs")!;

    expect(svs.days[0].dayName).toBe("City Construction");
    expect(svs.total).toBe(40 * 2000 + 3000 * 30);
  });
});
