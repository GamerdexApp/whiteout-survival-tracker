import { describe, expect, it } from "vitest";
import {
  bonusShards,
  clampSpins,
  estimatedShards,
  GEMS_PER_SPIN,
  GEMS_PER_TEN_SPINS,
  gemsNeeded,
  MAX_SPINS,
  SHARDS_PER_SPIN,
} from "@/service/luckyWheel";

describe("lucky wheel odds", () => {
  it("averages 0.5466 shards a spin, from the 5 shard and 1 shard odds", () => {
    expect(SHARDS_PER_SPIN).toBeCloseTo(0.5466, 4);
  });

  it("adds the bonus shards at spins 5, 15, 35, 70 and 120", () => {
    expect(bonusShards(0)).toBe(0);
    expect(bonusShards(4)).toBe(0);
    expect(bonusShards(5)).toBe(5);
    expect(bonusShards(15)).toBe(15);
    expect(bonusShards(35)).toBe(35);
    expect(bonusShards(70)).toBe(65);
    expect(bonusShards(120)).toBe(115);
    expect(bonusShards(150)).toBe(115);
  });

  it("follows the expected shards the package lists, rounded down so the plan does not count on luck", () => {
    expect(estimatedShards(5)).toBe(7);
    expect(estimatedShards(15)).toBe(23);
    expect(estimatedShards(35)).toBe(54);
    expect(estimatedShards(70)).toBe(103);
    expect(estimatedShards(120)).toBe(180);
    // The package lists 197.0 for 150 spins. The exact value is 196.99.
    expect(estimatedShards(150)).toBe(196);
  });
});

describe("lucky wheel gems", () => {
  it("prices one spin at 1,500 gems and ten spins at 13,500", () => {
    expect(GEMS_PER_SPIN).toBe(1_500);
    expect(GEMS_PER_TEN_SPINS).toBe(13_500);
    expect(gemsNeeded(1, 0)).toBe(1_500);
    expect(gemsNeeded(10, 0)).toBe(13_500);
    expect(gemsNeeded(120, 0)).toBe(162_000);
  });

  it("buys full tens first and the rest one at a time", () => {
    expect(gemsNeeded(20, 3)).toBe(24_000);
    expect(gemsNeeded(20, 0)).toBe(27_000);
    expect(gemsNeeded(25, 0)).toBe(2 * 13_500 + 5 * 1_500);
  });

  it("lets the tokens cover the first spins and never goes below 0 gems", () => {
    expect(gemsNeeded(20, 30)).toBe(0);
    expect(gemsNeeded(20, 20)).toBe(0);
    expect(gemsNeeded(0, 5)).toBe(0);
  });
});

describe("lucky wheel spins", () => {
  it("allows 0 to 150 whole spins", () => {
    expect(MAX_SPINS).toBe(150);
    expect(clampSpins(999)).toBe(150);
    expect(clampSpins(-4)).toBe(0);
    expect(clampSpins(12.8)).toBe(12);
  });
});
