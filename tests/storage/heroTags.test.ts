import { describe, expect, it } from "vitest";
import type { Playthrough } from "@/types/app";
import {
  applyHeroChange,
  heroCountWithTag,
  topHeroesLevel,
  withDrillCampLevels,
} from "@/service/heroes";
import { veteranChief } from "./fixtures";

const heroes = (levels: Record<string, number>): Playthrough => ({
  ...veteranChief(),
  heroes: Object.fromEntries(
    Object.entries(levels).map(([id, level]) => [id, { owned: true, level }]),
  ),
});

const tag = (
  chief: Playthrough,
  heroId: string,
  value: "top5" | "drillCamp" | null,
) => applyHeroChange(chief, { kind: "tag", heroId, tag: value });

describe("hero Top 5 and Drill Camp tags", () => {
  it("sets a Drill Camp hero to the lowest level of the Top 5 heroes", () => {
    let chief = heroes({ a: 60, b: 50, c: 70, d: 10 });
    chief = tag(tag(tag(chief, "a", "top5"), "b", "top5"), "c", "top5");
    chief = tag(chief, "d", "drillCamp");
    expect(topHeroesLevel(chief)).toBe(50);
    expect(chief.heroes?.d.level).toBe(50);
  });

  it("lowers a Drill Camp hero that is above the lowest Top 5 level", () => {
    let chief = heroes({ a: 40, d: 80 });
    chief = tag(tag(chief, "a", "top5"), "d", "drillCamp");
    expect(chief.heroes?.d.level).toBe(40);
  });

  it("follows a Top 5 level change", () => {
    let chief = tag(
      tag(heroes({ a: 40, d: 10 }), "a", "top5"),
      "d",
      "drillCamp",
    );
    chief = applyHeroChange(chief, { kind: "level", heroId: "a", level: 55 });
    expect(chief.heroes?.d.level).toBe(55);
  });

  it("keeps the level of a Drill Camp hero while no hero is in the Top 5", () => {
    const chief = tag(heroes({ d: 33 }), "d", "drillCamp");
    expect(chief.heroes?.d.level).toBe(33);
    expect(withDrillCampLevels(chief)).toBe(chief);
  });

  it("allows 5 Top 5 heroes and 15 Drill Camp heroes", () => {
    const ids = Array.from({ length: 22 }, (_, index) => `h${index}`);
    let chief = heroes(Object.fromEntries(ids.map((id) => [id, 10])));
    ids.forEach((id) => {
      chief = tag(chief, id, "top5");
    });
    expect(heroCountWithTag(chief, "top5")).toBe(5);
    ids.slice(5).forEach((id) => {
      chief = tag(chief, id, "drillCamp");
    });
    expect(heroCountWithTag(chief, "drillCamp")).toBe(15);
  });

  it("drops the tag when a hero is no longer owned", () => {
    let chief = tag(heroes({ a: 10 }), "a", "top5");
    chief = applyHeroChange(chief, {
      kind: "owned",
      heroId: "a",
      owned: false,
    });
    expect(chief.heroes?.a.tag).toBeUndefined();
    expect(topHeroesLevel(chief)).toBeUndefined();
  });

  it("moves a hero from one group to the other", () => {
    let chief = tag(heroes({ a: 10 }), "a", "top5");
    chief = tag(chief, "a", "drillCamp");
    expect(chief.heroes?.a.tag).toBe("drillCamp");
    expect(heroCountWithTag(chief, "top5")).toBe(0);
  });
});
