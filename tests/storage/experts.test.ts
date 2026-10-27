import { describe, expect, it } from "vitest";
import type { ExpertState, Playthrough } from "@/types/app";
import {
  affinityAvailable,
  applyExpertChange,
  buildExpertViews,
  expertPlanChecks,
  learningMinutesUsed,
  runExpertsPlan,
  sanitizeGoal,
  skillCapOf,
  skillFloorOf,
  skillGateOf,
  skillGoalCapOf,
  skillGoalFloorOf,
  skillGoalGateOf,
} from "@/service/experts";
import type { ExpertView } from "@/service/experts";
import { veteranChief, withInventory } from "./fixtures";

const SKILLS = {
  entrapment: 0,
  scavenging: 1,
  weaponMaster: 2,
  ursasBane: 3,
};

const cyrille = (state: ExpertState, inventory?: Record<string, number>) => {
  const chief: Playthrough = {
    ...veteranChief(),
    experts: { cyrille: { recruited: true, ...state } },
  };
  return inventory ? withInventory(chief, inventory) : chief;
};

const viewOf = (chief: Playthrough): ExpertView =>
  buildExpertViews(chief).find((view) => view.expert.id === "cyrille")!;

describe("expert skill requirements", () => {
  it("keeps a skill locked until the affinity level unlocks it", () => {
    const view = viewOf(cyrille({ affinity: 10 }));

    expect(view.skillLevels).toEqual([1, 0, 0, 0]);
    expect(skillCapOf(view, SKILLS.scavenging)).toBe(0);
  });

  it("keeps Entrapment open from affinity level 1, below its first cap", () => {
    const view = viewOf(cyrille({ affinity: 5, skills: [3, 0, 0, 0] }));

    expect(view.skillLevels[SKILLS.entrapment]).toBe(3);
    // Level 5 of Entrapment needs affinity level 30.
    expect(skillCapOf(view, SKILLS.entrapment)).toBe(4);
  });

  it("lowers a saved level that the total skill level does not allow", () => {
    // Weapon Master level 5 needs a total of 15 before the upgrade. Here the total is 14.
    const view = viewOf(
      cyrille({ affinity: 40, advanced: true, skills: [7, 2, 5, 1] }),
    );

    expect(view.skillLevels).toEqual([7, 2, 4, 1]);
  });

  it("stops a skill at the level it can take now and says why", () => {
    const view = viewOf(
      cyrille({ affinity: 40, advanced: true, skills: [7, 2, 4, 1] }),
    );

    expect(skillCapOf(view, SKILLS.weaponMaster)).toBe(4);
    expect(skillGateOf(view, SKILLS.weaponMaster)).toEqual({
      kind: "total",
      level: 5,
      total: 15,
      have: 14,
    });
  });

  it("opens the next level once the total is met", () => {
    const view = viewOf(
      cyrille({ affinity: 40, advanced: true, skills: [7, 2, 4, 2] }),
    );

    expect(skillCapOf(view, SKILLS.weaponMaster)).toBe(5);
    expect(skillGateOf(view, SKILLS.weaponMaster)).toBeNull();
  });

  it("names the affinity level that a capped skill waits for", () => {
    const view = viewOf(
      cyrille({ affinity: 40, advanced: true, skills: [7, 1, 1, 1] }),
    );

    expect(skillCapOf(view, SKILLS.entrapment)).toBe(7);
    expect(skillGateOf(view, SKILLS.entrapment)).toEqual({
      kind: "affinity",
      level: 8,
      affinity: 50,
    });
  });

  it("holds a skill above the level that another skill level depends on", () => {
    const view = viewOf(
      cyrille({ affinity: 40, advanced: true, skills: [7, 2, 5, 2] }),
    );

    expect(view.skillLevels).toEqual([7, 2, 5, 2]);
    expect(skillFloorOf(view, SKILLS.ursasBane)).toBe(2);
    expect(skillFloorOf(view, SKILLS.entrapment)).toBe(7);
    expect(skillFloorOf(view, SKILLS.weaponMaster)).toBeLessThan(5);
  });

  it("clamps a level change to what the rules allow", () => {
    const chief = cyrille({
      affinity: 40,
      advanced: true,
      skills: [7, 2, 4, 1],
    });
    const raised = applyExpertChange(chief, {
      kind: "skill",
      expertId: "cyrille",
      index: SKILLS.weaponMaster,
      level: 5,
    });
    const lowered = applyExpertChange(
      cyrille({ affinity: 40, advanced: true, skills: [7, 2, 5, 2] }),
      { kind: "skill", expertId: "cyrille", index: SKILLS.ursasBane, level: 1 },
    );

    expect(viewOf(raised).skillLevels[SKILLS.weaponMaster]).toBe(4);
    expect(viewOf(lowered).skillLevels[SKILLS.ursasBane]).toBe(2);
  });

  it("does not count an advancement the expert has not bought", () => {
    const notAdvanced = viewOf(cyrille({ affinity: 20, skills: [4, 2, 0, 0] }));
    const advanced = viewOf(
      cyrille({ affinity: 20, advanced: true, skills: [4, 2, 0, 0] }),
    );

    expect(skillCapOf(notAdvanced, SKILLS.scavenging)).toBe(0);
    expect(skillCapOf(advanced, SKILLS.scavenging)).toBe(2);
  });
});

describe("expert plan goals", () => {
  const view = viewOf(
    cyrille({ affinity: 40, advanced: true, skills: [3, 1, 2, 1] }),
  );

  it("locks a goal until the other goals give the total it needs", () => {
    expect(skillGoalCapOf(view, {}, SKILLS.weaponMaster)).toBe(2);
    expect(skillGoalGateOf(view, {}, SKILLS.weaponMaster)).toEqual({
      kind: "total",
      level: 3,
      total: 10,
      have: 7,
    });

    const raised = { skills: [7, 1, 2, 1] };
    // Level 4 keeps the need of level 3, a total of 10. Level 5 needs a total of 15.
    expect(skillGoalCapOf(view, raised, SKILLS.weaponMaster)).toBe(4);
  });

  it("stops a goal from dropping below what another goal needs", () => {
    const goal = { affinity: 40, advanced: true, skills: [7, 1, 3, 1] };

    expect(skillGoalFloorOf(view, goal, SKILLS.entrapment)).toBe(6);
  });

  it("cuts a goal set that cannot be reached to the part that can", () => {
    const clean = sanitizeGoal(view, { skills: [3, 1, 5, 1] });

    expect(clean.skills).toEqual([3, 1, 2, 1]);
  });

  it("keeps a goal that the plan can reach", () => {
    const clean = sanitizeGoal(view, { skills: [7, 1, 3, 1] });

    expect(clean.skills).toEqual([7, 1, 3, 1]);
  });
});

describe("expert plan stock", () => {
  const goals = {
    cyrille: { affinity: 44, advanced: true, skills: [3, 0, 0, 0] },
  };

  it("counts the gifts on the Resources page once, plus the points saved on the card", () => {
    const chief = cyrille(
      { affinity: 40, advanced: true, affinityAvailable: 100 },
      { compass: 7, "fiery-heart": 8, "sail-of-conquest": 9 },
    );
    const plan = runExpertsPlan(chief, goals);

    expect(plan.giftAffinity).toBe(9_870);
    expect(affinityAvailable(plan)).toBe(9_970);
  });

  it("shows the affinity held even when the plan needs none", () => {
    const chief = cyrille(
      { affinity: 40, advanced: true },
      { "sail-of-conquest": 2 },
    );
    const plan = runExpertsPlan(chief, {
      cyrille: { affinity: 40, advanced: true, skills: [3, 0, 0, 0] },
    });
    const affinity = expertPlanChecks(plan, chief).find(
      (check) => check.id === "affinity",
    )!;

    expect(affinity.needed).toBe(0);
    expect(affinity.available).toBe(2_000);
  });

  it("shares the gift affinity across the planned experts in order", () => {
    const chief: Playthrough = {
      ...cyrille({ affinity: 1 }, { compass: 100 }),
      experts: {
        cyrille: { recruited: true, affinity: 1 },
        agnes: { recruited: true, affinity: 1 },
      },
    };
    const plan = runExpertsPlan(chief, {
      cyrille: { affinity: 5, skills: [1, 0, 0, 0] },
      agnes: { affinity: 5, skills: [0, 0, 0, 0] },
    });
    const held = plan.rows.map((row) => row.affinityHeld);
    const needed = plan.rows.map((row) => row.affinity);

    expect(held[0]).toBe(Math.min(needed[0], 1_000));
    expect(held[0] + held[1]).toBeLessThanOrEqual(1_000);
  });

  it("uses the learning speedups held and the general share set for the plan", () => {
    const chief = cyrille(
      { affinity: 40, advanced: true, skills: [3, 0, 0, 0] },
      { "speedup-learning-1h": 3, "speedup-general-1h": 10 },
    );
    const plan = runExpertsPlan(chief, {
      cyrille: { affinity: 40, advanced: true, skills: [6, 0, 0, 0] },
    });

    expect(learningMinutesUsed(plan, chief)).toBe(180);
    const shared = { ...chief, generalSpeedupShare: { experts: 50 } };
    expect(learningMinutesUsed(plan, shared)).toBe(480);
  });
});
