import { describe, expect, it } from "vitest";
import {
  constructionSpeedupMinutes,
  generalMinutesApplied,
  generalSharePercent,
  MAX_COUNT,
  maxGeneralShare,
  minutesOfSpeedup,
  ownedCount,
  researchSpeedupMinutes,
  speedupStock,
  stepFor,
  withGeneralShare,
  withOwnedCount,
  withOwnedCounts,
} from "@/service/inventory";
import { emptyChief, withInventory } from "./fixtures";

describe("owned counts", () => {
  it("reads 0 for an item that was never counted", () => {
    expect(ownedCount(emptyChief(), "meat")).toBe(0);
  });

  it("removes the key when the count is 0, so the save holds only what is owned", () => {
    const chief = withOwnedCount(emptyChief(), "meat", 12);
    const cleared = withOwnedCount(chief, "meat", 0);

    expect(chief.inventory).toEqual({ meat: 12 });
    expect(cleared.inventory).toEqual({});
  });

  it("clamps to a whole number from 0 to the maximum", () => {
    const chief = emptyChief();

    expect(ownedCount(withOwnedCount(chief, "wood", -5), "wood")).toBe(0);
    expect(ownedCount(withOwnedCount(chief, "wood", 7.9), "wood")).toBe(7);
    expect(ownedCount(withOwnedCount(chief, "wood", Number.NaN), "wood")).toBe(
      0,
    );
    expect(
      ownedCount(withOwnedCount(chief, "wood", MAX_COUNT * 10), "wood"),
    ).toBe(MAX_COUNT);
  });

  it("writes several counts at once and keeps the other counts", () => {
    const chief = withInventory(emptyChief(), { coal: 4, iron: 9 });
    const next = withOwnedCounts(chief, { coal: 0, wood: 3 });

    expect(next.inventory).toEqual({ iron: 9, wood: 3 });
    expect(chief.inventory).toEqual({ coal: 4, iron: 9 });
  });

  it("steps the base resources by 10,000 and everything else by 1", () => {
    expect(stepFor("meat")).toBe(10_000);
    expect(stepFor("steel")).toBe(10_000);
    expect(stepFor("compass")).toBe(1);
  });
});

describe("speedup stock", () => {
  it("adds up the minutes of each type from the owned counts", () => {
    const chief = withInventory(emptyChief(), {
      "speedup-construction-1h": 3,
      "speedup-construction-5m": 2,
      "speedup-general-1h": 10,
    });

    expect(minutesOfSpeedup(chief, "construction")).toBe(190);
    expect(minutesOfSpeedup(chief, "general")).toBe(600);
    expect(minutesOfSpeedup(chief, "research")).toBe(0);
    expect(speedupStock(chief).map((stock) => stock.type)).toContain(
      "learning",
    );
  });
});

describe("general speedup share", () => {
  const chief = withInventory(emptyChief(), {
    "speedup-general-1h": 10,
    "speedup-construction-1h": 5,
    "speedup-research-1h": 2,
  });

  it("starts at 0 for every plan, so no general minutes count", () => {
    expect(generalSharePercent(chief, "buildings")).toBe(0);
    expect(generalMinutesApplied(chief, "buildings")).toBe(0);
    expect(constructionSpeedupMinutes(chief)).toBe(300);
    expect(researchSpeedupMinutes(chief)).toBe(120);
  });

  it("adds its share of the general minutes to the plan", () => {
    const shared = withGeneralShare(chief, "buildings", 40);

    expect(generalMinutesApplied(shared, "buildings")).toBe(240);
    expect(constructionSpeedupMinutes(shared)).toBe(540);
    expect(researchSpeedupMinutes(shared)).toBe(120);
  });

  it("keeps the four shares at 100 percent or less", () => {
    let shared = withGeneralShare(chief, "buildings", 70);
    shared = withGeneralShare(shared, "research", 50);

    expect(generalSharePercent(shared, "research")).toBe(30);
    expect(maxGeneralShare(shared, "troops")).toBe(0);
    expect(
      generalSharePercent(withGeneralShare(shared, "troops", 10), "troops"),
    ).toBe(0);
  });

  it("lets a plan lower its own share to free room for another", () => {
    let shared = withGeneralShare(chief, "buildings", 100);
    shared = withGeneralShare(shared, "buildings", 20);
    shared = withGeneralShare(shared, "experts", 80);

    expect(generalSharePercent(shared, "experts")).toBe(80);
  });

  it("rounds the applied minutes down and ignores a share below 0", () => {
    const small = withInventory(emptyChief(), { "speedup-general-5m": 1 });

    expect(
      generalMinutesApplied(
        withGeneralShare(small, "research", 50),
        "research",
      ),
    ).toBe(2);
    expect(
      generalSharePercent(withGeneralShare(small, "research", -10), "research"),
    ).toBe(0);
  });
});
