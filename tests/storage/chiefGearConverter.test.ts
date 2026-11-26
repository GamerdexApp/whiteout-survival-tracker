import { describe, expect, it } from "vitest";
import { ladderChecks } from "@/service/chiefGear";
import { emptyChief, startedDaysAgo, withInventory } from "./fixtures";

const chiefWith = (inventory: Record<string, number>, ageDays: number) =>
  withInventory(
    { ...emptyChief(), serverStartDate: startedDaysAgo(ageDays) },
    inventory,
  );

const amber = (checks: ReturnType<typeof ladderChecks>) =>
  checks.find((check) => check.id === "lunar-amber")!;

describe("chief gear plan conversions", () => {
  it("covers Lunar Amber with spare Design Plans once the converter is unlocked", () => {
    const chief = chiefWith({ "lunar-amber": 5, "design-plans": 130 }, 200);
    const checks = ladderChecks(
      [
        { itemId: "lunar-amber", amount: 20 },
        { itemId: "design-plans", amount: 30 },
      ],
      chief,
      "gear",
    );

    const plans = checks.find((check) => check.id === "design-plans")!;

    expect(amber(checks).available).toBe(5 + 10);
    expect(amber(checks).detail).toBe("10 from converting 100 Design Plans");
    expect(plans.available).toBe(30);
    expect(plans.detail).toBe("100 set aside for conversion");
  });

  it("converts only what the shortage needs", () => {
    const chief = chiefWith({ "lunar-amber": 18, "design-plans": 500 }, 200);
    const checks = ladderChecks(
      [{ itemId: "lunar-amber", amount: 20 }],
      chief,
      "gear",
    );

    expect(amber(checks).available).toBe(20);
    expect(amber(checks).detail).toBe("2 from converting 20 Design Plans");
  });

  it("does not spend Design Plans that the plan needs", () => {
    const chief = chiefWith({ "design-plans": 30 }, 200);
    const checks = ladderChecks(
      [
        { itemId: "lunar-amber", amount: 5 },
        { itemId: "design-plans", amount: 30 },
      ],
      chief,
      "gear",
    );

    expect(amber(checks).available).toBe(0);
    expect(amber(checks).detail).toBeUndefined();
  });

  it("stops at the weekly limit", () => {
    const chief = chiefWith({ "design-plans": 10_000 }, 200);
    const checks = ladderChecks(
      [{ itemId: "lunar-amber", amount: 900 }],
      chief,
      "gear",
    );

    expect(amber(checks).available).toBe(500);
  });

  it("counts nothing before the converter unlocks and names its day", () => {
    const chief = chiefWith({ "design-plans": 500 }, 100);
    const checks = ladderChecks(
      [{ itemId: "lunar-amber", amount: 20 }],
      chief,
      "gear",
    );

    expect(amber(checks).available).toBe(0);
    expect(amber(checks).detail).toBe(
      "The converter unlocks on server day 180.",
    );
  });

  it("counts conversions when the server start date is unknown", () => {
    const chief = withInventory(emptyChief(), { "design-plans": 100 });
    const checks = ladderChecks(
      [{ itemId: "lunar-amber", amount: 5 }],
      chief,
      "gear",
    );

    expect(amber(checks).available).toBe(5);
  });

  it("covers Charm Secrets from spare Charm Guides, then Charm Designs", () => {
    const chief = chiefWith(
      { "charm-guide": 60, "charm-design": 100, "charm-secrets": 1 },
      500,
    );
    const checks = ladderChecks(
      [{ itemId: "charm-secrets", amount: 4 }],
      chief,
      "charm",
    );
    const secrets = checks[0];

    expect(secrets.available).toBe(4);
    expect(secrets.detail).toBe(
      "1 from converting 40 Charm Guide · 2 from converting 80 Charm Design",
    );
  });

  it("leaves other materials on their own count", () => {
    const chief = chiefWith({ "hardened-alloy": 7 }, 200);
    const [alloy] = ladderChecks(
      [{ itemId: "hardened-alloy", amount: 50 }],
      chief,
      "gear",
    );

    expect(alloy.available).toBe(7);
    expect(alloy.detail).toBeUndefined();
  });
});
