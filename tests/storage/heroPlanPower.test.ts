import { describe, expect, it } from "vitest";
import type { HeroGoal } from "@/types/app";
import {
  buildHeroViews,
  heroPowerGain,
  heroPowerParts,
  runHeroPlan,
} from "@/service/heroes";
import { veteranChief } from "./fixtures";

const chief = {
  ...veteranChief(),
  heroes: { smith: { owned: true, star: 1, tier: 0, level: 30 } },
};

const smith = () =>
  buildHeroViews(chief).find((view) => view.hero.id === "smith")!;

const raisedSkill = (): HeroGoal => {
  const view = smith();
  const name = Object.keys(view.skillLevels)[0];
  return {
    star: view.stars.star,
    tier: view.stars.tier,
    skills: { [name]: view.skillLevels[name] + 1 },
  };
};

describe("hero plan power gain", () => {
  it("is zero when the goal stays at the current levels", () => {
    const view = smith();
    const goal: HeroGoal = { star: view.stars.star, tier: view.stars.tier };

    expect(heroPowerGain(view, goal)).toBe(0);
  });

  it("is the power with the goal levels minus the power now", () => {
    const view = smith();
    const goal = raisedSkill();
    const name = Object.keys(goal.skills!)[0];
    const raised = {
      ...view,
      skillLevels: { ...view.skillLevels, [name]: goal.skills![name] },
    };
    const gain = heroPowerGain(view, goal);

    expect(gain).toBe(
      heroPowerParts(raised).total! - heroPowerParts(view).total!,
    );
    expect(gain).toBeGreaterThan(0);
  });

  it("adds the power of every planned hero", () => {
    const plan = runHeroPlan(chief, { smith: raisedSkill() });

    expect(plan.rows[0].powerGain).toBe(heroPowerGain(smith(), raisedSkill()));
    expect(plan.powerGain).toBe(plan.rows[0].powerGain);
  });

  it("is zero for a plan with no hero", () => {
    expect(runHeroPlan(chief, {}).powerGain).toBe(0);
  });
});
