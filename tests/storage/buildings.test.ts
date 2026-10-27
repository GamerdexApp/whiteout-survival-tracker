import { describe, expect, it } from "vitest";
import type { Playthrough } from "@/types/app";
import { initialPlanRows, rowFor } from "@/service/buildingPlan";
import { buildView } from "@/service/buildings";
import { findBuildingById, levelledBuildings } from "@/data/game/buildings";
import { veteranChief } from "./fixtures";

const researchCenter = findBuildingById("research-center")!;
const finalLevel = researchCenter.levels.at(-1)!.label;
const levelBeforeFinal = researchCenter.levels.at(-2)!.label;

const withBuilding = (
  id: string,
  level: string,
  goal?: string,
): Playthrough => ({
  ...veteranChief(),
  buildings: { [id]: { level, ...(goal ? { goal } : {}) } },
});

describe("a building at its final level", () => {
  it("is maxed and has no next level", () => {
    const view = buildView(
      researchCenter,
      withBuilding("research-center", finalLevel),
    );

    expect(view.maxed).toBe(true);
    expect(view.next).toBeUndefined();
  });

  it("gets no row in the plan, so it is not offered as an upgrade", () => {
    expect(
      rowFor(withBuilding("research-center", finalLevel), "research-center"),
    ).toBeUndefined();
  });

  it("is not maxed one level before the end, and its row aims at the next level", () => {
    const chief = withBuilding("research-center", levelBeforeFinal);
    const view = buildView(researchCenter, chief);

    expect(view.maxed).toBe(false);
    expect(rowFor(chief, "research-center")).toEqual({
      id: "research-center",
      current: levelBeforeFinal,
      goal: finalLevel,
    });
  });
});

describe("plan rows from the goals on the Buildings page", () => {
  it("opens with one row for each building whose goal is above its level", () => {
    const chief = withBuilding("research-center", levelBeforeFinal, finalLevel);

    expect(initialPlanRows(chief)).toEqual([
      { id: "research-center", current: levelBeforeFinal, goal: finalLevel },
    ]);
  });

  it("has no row for a goal equal to the current level", () => {
    expect(
      initialPlanRows(withBuilding("research-center", finalLevel, finalLevel)),
    ).toEqual([]);
  });

  it("covers only the buildings that have levels", () => {
    expect(levelledBuildings.length).toBeGreaterThan(10);
    expect(
      levelledBuildings.every((building) => building.levels.length > 1),
    ).toBe(true);
  });
});
