export const GAMERDEX_URL = "https://gamerdex.app";

export const SITE_URL = "https://whiteout-survival.gamerdex.app";

export const SITE_DESCRIPTION =
  "Track your Whiteout Survival chiefs, buildings, heroes, research and events in one place. Your data stays in your browser.";

const DISCORD_INVITE_CODE = /^[A-Za-z0-9-]+$/;

/** The Discord invite link. It is null when `NEXT_PUBLIC_DISCORD_INVITE` is missing or is not a bare invite code. */
export const DISCORD_URL = DISCORD_INVITE_CODE.test(
  process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "",
)
  ? `https://discord.gg/${process.env.NEXT_PUBLIC_DISCORD_INVITE}`
  : null;
