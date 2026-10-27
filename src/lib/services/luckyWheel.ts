import { events } from "whiteout-survival-data";

export const MAX_SPINS = 150;
export const GEMS_PER_SPIN = 1_500;
export const GEMS_PER_TEN_SPINS = 13_500;
const SPINS_PER_PACK = 10;

/**
 * The shards of one spin on average. The wheel gives 5 shards at 4.37% and 1 shard at 32.81%, which
 * the Lucky Wheel event data lists as the reward odds.
 */
export const SHARDS_PER_SPIN = 5 * 0.0437 + 1 * 0.3281;

const spinBonuses = (events().find("lucky-wheel")?.tiers ?? []).flatMap(
  (tier) =>
    tier.scoreTotal === undefined
      ? []
      : [
          {
            spins: tier.scoreTotal,
            shards: (tier.rewards ?? []).reduce(
              (sum, reward) => sum + (reward.amount ?? 0),
              0,
            ),
          },
        ],
);

export const bonusShards = (spins: number) =>
  spinBonuses
    .filter((bonus) => bonus.spins <= spins)
    .reduce((sum, bonus) => sum + bonus.shards, 0);

/**
 * The bonus shards are exact. The shards from the spins themselves are an average, so the total
 * rounds down and the plan does not count on luck.
 */
export const estimatedShards = (spins: number) =>
  Math.floor(bonusShards(spins) + spins * SHARDS_PER_SPIN);

/** The tokens cover the first spins. The rest cost gems, 10 at a time where they can. */
export const gemsNeeded = (spins: number, tokens: number) => {
  const paidSpins = Math.max(0, spins - tokens);
  return (
    Math.floor(paidSpins / SPINS_PER_PACK) * GEMS_PER_TEN_SPINS +
    (paidSpins % SPINS_PER_PACK) * GEMS_PER_SPIN
  );
};

export const clampSpins = (spins: number) =>
  Math.min(MAX_SPINS, Math.max(0, Math.floor(spins)));
