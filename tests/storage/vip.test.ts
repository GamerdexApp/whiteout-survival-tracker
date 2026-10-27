import { describe, expect, it } from "vitest";
import { msUntilNextUtcDay, utcDayBefore, utcDayOf } from "@/service/utcDay";
import {
  MAX_STREAK_DAY,
  totalXpOf,
  vipSignInOf,
  withVipSignIn,
  withVipStreakDay,
  withVipXp,
} from "@/service/vip";
import { emptyChief } from "./fixtures";

const noon = (day: string) => new Date(`${day}T12:00:00Z`);

describe("UTC days", () => {
  it("names the UTC day, whatever the clock of the device says", () => {
    expect(utcDayOf(new Date("2026-03-01T23:59:59Z"))).toBe("2026-03-01");
    expect(utcDayOf(new Date("2026-03-02T00:00:00Z"))).toBe("2026-03-02");
  });

  it("steps back over a month end and counts the time to the next midnight", () => {
    expect(utcDayBefore("2026-03-01")).toBe("2026-02-28");
    expect(msUntilNextUtcDay(Date.parse("2026-03-01T23:00:00Z"))).toBe(
      3_600_000,
    );
  });
});

describe("VIP daily sign-in", () => {
  const withXp = withVipXp(emptyChief(), 0);

  it("pays 100, 200, 300, 400 and then 500 XP as the streak grows", () => {
    let chief = withXp;
    const paid: number[] = [];
    for (let day = 1; day <= 6; day += 1) {
      const at = noon(`2026-05-0${day}`);
      const before = totalXpOf(chief)!;
      chief = withVipSignIn(chief, at);
      paid.push(totalXpOf(chief)! - before);
    }

    expect(paid).toEqual([100, 200, 300, 400, 500, 500]);
  });

  it("counts a day once", () => {
    const first = withVipSignIn(withXp, noon("2026-05-01"));
    const again = withVipSignIn(first, noon("2026-05-01"));

    expect(again).toBe(first);
    expect(vipSignInOf(first, noon("2026-05-01").getTime()).claimedToday).toBe(
      true,
    );
  });

  it("starts the streak again after a missed day", () => {
    let chief = withVipSignIn(withXp, noon("2026-05-01"));
    chief = withVipSignIn(chief, noon("2026-05-02"));
    const next = vipSignInOf(chief, noon("2026-05-04").getTime());

    expect(next.streak).toBe(1);
    expect(next.points).toBe(100);
  });

  it("does nothing when the chief has no XP set", () => {
    const chief = emptyChief();

    expect(withVipSignIn(chief, noon("2026-05-01"))).toBe(chief);
  });

  it("shows the XP of tomorrow", () => {
    const signIn = vipSignInOf(withXp, noon("2026-05-01").getTime());

    expect(signIn.points).toBe(100);
    expect(signIn.tomorrowPoints).toBe(200);
  });
});

describe("VIP streak day", () => {
  const at = noon("2026-05-10");
  const withXp = withVipXp(emptyChief(), 5_000);

  it("sets the day that the next sign-in counts and leaves the XP alone", () => {
    const chief = withVipStreakDay(withXp, 4, at);

    expect(vipSignInOf(chief, at.getTime()).streak).toBe(4);
    expect(totalXpOf(chief)).toBe(5_000);
  });

  it("sets the day already counted when today is claimed", () => {
    const claimed = withVipSignIn(withXp, at);
    const chief = withVipStreakDay(claimed, 7, at);

    expect(vipSignInOf(chief, at.getTime()).streak).toBe(7);
    expect(vipSignInOf(chief, at.getTime()).claimedToday).toBe(true);
  });

  it("keeps the day from 1 to the maximum", () => {
    expect(
      vipSignInOf(withVipStreakDay(withXp, 0, at), at.getTime()).streak,
    ).toBe(1);
    expect(
      vipSignInOf(withVipStreakDay(withXp, 99_999, at), at.getTime()).streak,
    ).toBe(MAX_STREAK_DAY);
  });
});
