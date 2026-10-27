import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withVipXp } from "@/service/vip";
import { VipView } from "@/comps/vip/VipView";
import { emptyChief } from "../storage/fixtures";
import { button, click, Live, mount, savedChief, seed, text, unmount } from "./harness";

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-05-01T12:00:00Z") }));
afterEach(async () => {
	await unmount();
	vi.useRealTimers();
});

describe("VIP page sign-in", () => {
	it("asks for XP or a level before the first sign-in", async () => {
		const chief = emptyChief();
		seed(chief);
		await mount(<Live>{(live) => <VipView chief={live} />}</Live>);

		expect((button("Add daily sign-in") as HTMLButtonElement).disabled).toBe(true);
		expect(text()).toContain("Enter your total XP or VIP level first.");
	});

	it("adds the XP of the streak day once and records the day", async () => {
		const chief = withVipXp(emptyChief(), 1000);
		seed(chief);
		await mount(<Live>{(live) => <VipView chief={live} />}</Live>);

		await click(button("Add daily sign-in"));

		expect(savedChief().vip?.totalXp).toBe(1100);
		expect(savedChief().vip?.signIn).toEqual({ streak: 1, day: "2026-05-01" });
		// The button gives way to the signed in text, so the day cannot count twice.
		expect(button("Add daily sign-in")).toBeUndefined();
		expect(text()).toContain("Signed in today, on streak day 1");
	});

	it("takes the sign-in back with Undo", async () => {
		const chief = withVipXp(emptyChief(), 1000);
		seed(chief);
		await mount(<Live>{(live) => <VipView chief={live} />}</Live>);

		await click(button("Add daily sign-in"));
		await click(button("Undo"));

		expect(savedChief().vip?.totalXp).toBe(1000);
		expect(savedChief().vip?.signIn).toBeUndefined();
	});
});
