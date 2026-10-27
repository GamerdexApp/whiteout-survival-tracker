import { describe, expect, it } from "vitest";
import type { HeroGoal, HeroState, Playthrough } from "@/types/app";
import {
  buildHeroViews,
  effectiveLuckyWheel,
  hasEveryStar,
  heroPlanChecks,
  heroShardRarityOf,
  runHeroPlan,
  shardsOf,
  shardUse,
  unlockedHeroes,
  withHeroShards,
} from "@/service/heroes";
import { allHeroes, findHero } from "@/data/game/heroes";
import { emptyChief, withInventory } from "./fixtures";

const chiefWith = (
  heroes: Record<string, HeroState>,
  inventory: Record<string, number> = {},
): Playthrough =>
  withInventory(
    { ...emptyChief(), heroGenerationUnlocked: 2, heroes },
    inventory,
  );

const goalToStar = (star: number, tier = 0): HeroGoal => ({ star, tier });

describe("unlocked heroes", () => {
  it("lists the heroes up to the unlocked generation", () => {
    const chief = { ...emptyChief(), heroGenerationUnlocked: 1 };
    const generations = new Set(
      unlockedHeroes(chief).map((hero) => hero.generation),
    );

    expect([...generations].sort()).toEqual([0, 1]);
    expect(
      unlockedHeroes({ ...chief, heroGenerationUnlocked: 17 }),
    ).toHaveLength(allHeroes.length);
  });
});

describe("hero shards", () => {
  it("keeps the count in the inventory under the shard item of the hero", () => {
    const eugene = findHero("eugene")!;
    const chief = withHeroShards(
      chiefWith({ eugene: { owned: true, shards: 4 } }),
      "eugene",
      25,
    );

    expect(chief.inventory?.["eugene-shard"]).toBe(25);
    expect(chief.heroes?.eugene.shards).toBeUndefined();
    expect(shardsOf(chief, eugene)).toBe(25);
  });

  it("reads a count saved on the hero before the inventory held it", () => {
    const chief = chiefWith({ eugene: { owned: true, shards: 9 } });

    expect(shardsOf(chief, findHero("eugene")!)).toBe(9);
  });

  it("finds the rarity of a general shard item", () => {
    expect(heroShardRarityOf("epic-general-hero-shard")).toBe("Epic");
    expect(heroShardRarityOf("mythic-general-hero-shard")).toBe("Legendary");
    expect(heroShardRarityOf("meat")).toBeUndefined();
  });
});

describe("hero stars", () => {
  it("counts a hero as done only at the top star", () => {
    const chief = chiefWith({
      smith: { owned: true, star: 5, tier: 0 },
      eugene: { owned: true, star: 4, tier: 3 },
    });
    const views = buildHeroViews(chief);
    const done = (id: string) =>
      hasEveryStar(views.find((view) => view.hero.id === id)!);

    expect(done("smith")).toBe(true);
    expect(done("eugene")).toBe(false);
  });
});

describe("hero plan with the lucky wheel", () => {
  const chief = chiefWith({
    eugene: { owned: true, star: 0 },
    sergey: { owned: true, star: 0 },
  });
  const goals = { eugene: goalToStar(1, 2), sergey: goalToStar(1, 2) };

  it("adds the estimated shards to the hero the wheel is for", () => {
    const wheel = { heroId: "eugene", spins: 20, tokens: 3 };
    const plan = runHeroPlan(chief, goals, wheel);
    const luckyShards = Object.fromEntries(
      plan.rows.map((row) => [row.view.hero.id, row.luckyShards]),
    );

    expect(luckyShards).toEqual({ eugene: 25, sergey: 0 });
    expect(plan.luckySpins).toBe(20);
    expect(plan.luckyHeroName).toBe("Eugene");
    expect(plan.gems).toBe(24_000);
  });

  it("counts the wheel shards before the general shards", () => {
    const withoutWheel = shardUse(runHeroPlan(chief, goals));
    const withWheel = shardUse(
      runHeroPlan(chief, goals, { heroId: "eugene", spins: 20, tokens: 0 }),
    );

    expect(withoutWheel.fromOwnHero).toBe(0);
    expect(withWheel.fromOwnHero).toBeGreaterThan(0);
    expect(withWheel.total).toBe(withoutWheel.total);
  });

  it("asks nothing of the wheel when its hero is not in the plan", () => {
    const plan = runHeroPlan(
      chief,
      { sergey: goals.sergey },
      {
        heroId: "eugene",
        spins: 50,
        tokens: 0,
      },
    );

    expect(plan.gems).toBe(0);
    expect(plan.luckySpins).toBe(0);
    expect(plan.luckyHeroName).toBeNull();
  });

  it("falls to the first planned hero when the wheel hero is not planned", () => {
    const wheel = effectiveLuckyWheel(
      chief,
      { sergey: goals.sergey },
      {
        heroId: "eugene",
        spins: 5,
        tokens: 0,
      },
    );

    expect(wheel?.heroId).toBe("sergey");
    expect(
      effectiveLuckyWheel(chief, {}, { heroId: "", spins: 5, tokens: 0 }),
    ).toBeUndefined();
  });

  it("checks the gems against the Gems on the Resources page", () => {
    const rich = withInventory(chief, { gems: 10_000 });
    const plan = runHeroPlan(rich, goals, {
      heroId: "eugene",
      spins: 20,
      tokens: 3,
    });
    const gems = heroPlanChecks(plan, rich).find(
      (check) => check.id === "gems",
    )!;

    expect(gems.needed).toBe(24_000);
    expect(gems.available).toBe(10_000);
    expect(
      heroPlanChecks(runHeroPlan(rich, goals), rich).some(
        (check) => check.id === "gems",
      ),
    ).toBe(false);
  });
});
