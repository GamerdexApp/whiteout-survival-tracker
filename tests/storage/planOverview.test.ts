import { describe, expect, it } from "vitest";
import {
  availablePlanIds,
  overviewOf,
  summarizePlans,
} from "@/service/planOverview";
import type { PlanSummary } from "@/service/planOverview";
import { veteranChief } from "./fixtures";

const chief = veteranChief();

const summary = (
  id: PlanSummary["id"],
  needed: number,
  available = 100,
): PlanSummary => ({
  id,
  checks: [{ id: "meat", name: "Meat", needed, available }],
  what: [],
  queue: null,
  seconds: 0,
  power: 10,
  points: { svs: 5, showdown: 0, king: 0, hall: 0 },
});

describe("plan overview", () => {
  it("lists no plan for a chief with no goals", () => {
    expect(
      availablePlanIds({ ...chief, id: "empty" } as typeof chief),
    ).toBeInstanceOf(Array);
  });

  it("summarizes without throwing for every available plan", () => {
    expect(() => summarizePlans(chief, { useBonuses: true })).not.toThrow();
  });

  it("sums a shared resource across plans and checks it once", () => {
    const overview = overviewOf(
      chief,
      [summary("buildings", 60), summary("research", 70)],
      [],
    );
    const meat = overview.groups.find((group) => group.id === "base")!.rows[0];
    expect(meat.needed).toBe(130);
    expect(meat.parts.map((part) => part.amount)).toEqual([60, 70]);
    expect(overview.shortCount).toBe(1);
  });

  it("drops a plan that is turned off from every total", () => {
    const overview = overviewOf(
      chief,
      [summary("buildings", 60), summary("research", 70)],
      ["research"],
    );
    expect(overview.plans.map((plan) => plan.id)).toEqual(["buildings"]);
    expect(overview.power).toBe(10);
    expect(overview.points.svs).toBe(5);
    expect(
      overview.groups.find((group) => group.id === "base")!.rows[0].needed,
    ).toBe(60);
  });

  it("counts a saved beast plan that scores points", () => {
    const withBeasts = {
      ...chief,
      beastPlan: {
        stamina: 5000,
        beastLevel: 1,
        beastRuns: [{ level: 1, count: 10 }],
        polarTerrors: 0,
        leftover: "beasts" as const,
        savedAt: "2026-06-01T00:00:00.000Z",
      },
    };
    expect(availablePlanIds(chief)).not.toContain("beasts");
    expect(availablePlanIds(withBeasts)).toContain("beasts");
    const [beasts] = summarizePlans(withBeasts, { useBonuses: true });
    expect(beasts.points.svs).toBeGreaterThan(0);
    expect(beasts.power).toBe(0);
  });

  it("charges what the dedicated speedups cannot cover to the general bucket of each plan", () => {
    const held = {
      ...chief,
      inventory: { "speedup-construction-1h": 1, "speedup-general-1h": 10 },
      generalSpeedupShare: { buildings: 50, research: 50 },
    };
    const speedup = (
      id: PlanSummary["id"],
      checkId: string,
      needed: number,
      available: number,
    ) => ({
      ...summary(id, 0),
      checks: [{ id: checkId, name: checkId, needed, available, unit: "min" }],
    });
    const overview = overviewOf(
      held,
      [
        speedup("buildings", "construction-time", 400, 360),
        speedup("research", "research-time", 100, 300),
        speedup("troops", "training-time", 900, 200),
      ],
      [],
    );
    const rows = overview.groups.find((group) => group.id === "speedups")!.rows;
    const generalRow = rows[rows.length - 1];
    expect(rows.find((row) => row.id === "construction-time")!.needed).toBe(60);
    expect(rows.find((row) => row.id === "research-time")).toBeUndefined();
    expect(rows.find((row) => row.id === "training-time")!.needed).toBe(900);
    expect(generalRow.needed).toBe(440);
    expect(generalRow.available).toBe(600);
    expect(generalRow.parts).toEqual([
      { plan: "buildings", amount: 340 },
      { plan: "research", amount: 100 },
    ]);
  });
});
