import { describe, expect, it } from "vitest";
import { jobProgress, startedAtOf } from "@/service/queues";

const DAY = 86_400;
const HOUR = 3_600;
const now = new Date("2026-06-10T12:00:00.000Z");

const jobWith = (secondsLeft: number, fullSeconds: number) => ({
  startedAt: startedAtOf(now, secondsLeft, fullSeconds).toISOString(),
  endsAt: new Date(now.getTime() + secondsLeft * 1_000).toISOString(),
});

describe("progress of a job that is already running", () => {
  it("shows half done for 2 days 12 hours left of a 5 day upgrade", () => {
    const job = jobWith(2 * DAY + 12 * HOUR, 5 * DAY);

    expect(jobProgress(job, now.getTime())).toBeCloseTo(0.5, 5);
  });

  it("keeps filling from the saved start as time passes", () => {
    const job = jobWith(DAY, 5 * DAY);

    expect(jobProgress(job, now.getTime())).toBeCloseTo(0.8, 5);
    expect(jobProgress(job, now.getTime() + DAY * 1_000)).toBe(1);
  });

  it("starts at zero when the full time is the time left", () => {
    expect(jobProgress(jobWith(5 * DAY, 5 * DAY), now.getTime())).toBe(0);
  });

  it("starts now when more time is left than the full time or the full time is unknown", () => {
    expect(startedAtOf(now, 6 * DAY, 5 * DAY)).toEqual(now);
    expect(startedAtOf(now, 6 * DAY, 0)).toEqual(now);
  });
});
