import { afterEach, describe, expect, it } from "vitest";
import { DaybreakView } from "@/comps/daybreak/DaybreakView";
import { emptyChief, withInventory } from "../storage/fixtures";
import { field, mount, savedChief, seed, type, unmount } from "./harness";

afterEach(unmount);

describe("Daybreak Island page", () => {
	it("sets the Life Essence count in the same inventory as the Resources page", async () => {
		const chief = emptyChief();
		seed(chief);
		await mount(<DaybreakView chief={chief} />);

		await type(field("Life Essence owned"), "1234567");

		expect(savedChief().inventory).toEqual({ "life-essence": 1_234_567 });
	});

	it("shows the count already saved", async () => {
		const chief = withInventory(emptyChief(), { "life-essence": 4200 });
		seed(chief);
		await mount(<DaybreakView chief={chief} />);

		expect(field("Life Essence owned")?.value).toBe("4,200");
	});
});
