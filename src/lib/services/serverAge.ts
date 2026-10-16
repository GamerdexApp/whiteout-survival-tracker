import type { Playthrough } from "@/types/app";

const MS_PER_DAY = 86_400_000;

/**
 * The server age in days is today minus the server start date. It is never saved.
 */
export const serverAgeDays = (
  chief: Pick<Playthrough, "serverStartDate">,
  now = new Date(),
) => {
  if (!chief.serverStartDate) return null;
  const start = new Date(`${chief.serverStartDate}T00:00:00`);
  return Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY),
  );
};
