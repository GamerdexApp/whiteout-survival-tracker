import type { Playthrough } from "@/types/app";

const CREATED_AT = "2026-01-10T09:00:00.000Z";
const UPDATED_AT = "2026-06-01T18:30:00.000Z";

/** A chief that began 400 days ago, so the server age unlocks everything the tests plan. */
export const startedDaysAgo = (days: number, now = new Date()) =>
  new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);

export const emptyChief = (
  id = "chief-1",
  name = "Test Chief",
): Playthrough => ({
  id,
  name,
  createdAt: CREATED_AT,
  lastModified: UPDATED_AT,
  heroGenerationUnlocked: 1,
});

export const veteranChief = (): Playthrough => ({
  ...emptyChief("chief-veteran", "Veteran"),
  serverStartDate: startedDaysAgo(900),
  heroGenerationUnlocked: 12,
});

export const withInventory = (
  chief: Playthrough,
  inventory: Record<string, number>,
): Playthrough => ({ ...chief, inventory });
