import { describe, expect, it } from "vitest";
import {
  buildExpertViews,
  expertPowerOf,
  powerGainOf,
  runExpertsPlan,
  startingGoalFor,
} from "@/service/experts";
import { veteranChief, withInventory } from "./fixtures";

const chief = withInventory(
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
  {},
);

const cyrilleView = (source: typeof chief) =>
  buildExpertViews(source).find((item) => item.expert.id === "cyrille")!;

describe("expert plan power gain", () => {
  it("is zero when the goals stay at the current levels", () => {
    const plan = runExpertsPlan(chief, {
      cyrille: startingGoalFor(cyrilleView(chief)),
    });

    expect(powerGainOf(plan)).toBe(0);
  });

  it("is the power at the goals minus the power now", () => {
    const start = startingGoalFor(cyrilleView(chief));
    const skills = [...start.skills!];
    skills[0] += 3;
    const plan = runExpertsPlan(chief, { cyrille: { ...start, skills } });
    const raised = cyrilleView({
      ...chief,
      experts: {
        cyrille: { recruited: true, affinity: 40, advanced: true, skills },
      },
    });

    expect(plan.rows[0].powerGain).toBeGreaterThan(0);
    expect(plan.rows[0].powerGain).toBe(
      expertPowerOf(raised).now - expertPowerOf(cyrilleView(chief)).now,
    );
    expect(powerGainOf(plan)).toBe(plan.rows[0].powerGain);
  });
});
