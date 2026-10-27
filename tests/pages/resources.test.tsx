import { afterEach, describe, expect, it } from "vitest";
import { ResourcesView } from "@/comps/resources/ResourcesView";
import { routerState } from "../setup";
import { emptyChief, veteranChief, withInventory } from "../storage/fixtures";
import {
	button,
	click,
	field,
	mount,
	page,
	savedChief,
	seed,
	text,
	type,
	unmount,
} from "./harness";

afterEach(unmount);

describe("Resources page", () => {
	it("opens on the Core Resources tab with its sections closed", async () => {
		seed(emptyChief());
		await mount(<ResourcesView chief={emptyChief()} />);

		expect(button(/Core Resources/)?.getAttribute("aria-selected")).toBe("true");
		const sections = [...page().querySelectorAll("details")];
		expect(sections.length).toBeGreaterThanOrEqual(8);
		expect(sections.every((section) => !section.open)).toBe(true);
	});

	it("saves a typed count to the same inventory the All items tab reads", async () => {
		const chief = emptyChief();
		seed(chief);
		await mount(<ResourcesView chief={chief} />);

		await click(page().querySelector("details summary"));
		await type(field("Meat owned"), "1500000");
		await type(field("1k Meat (Secured) owned"), "25");

		expect(savedChief().inventory).toEqual({ meat: 1_500_000, "meat-1k-secured": 25 });
	});

	it("removes a count that is typed back to 0, so the save holds what is owned", async () => {
		const chief = withInventory(emptyChief(), { meat: 40 });
		seed(chief);
		await mount(<ResourcesView chief={chief} />);

		await click(page().querySelector("details summary"));
		await type(field("Meat owned"), "0");

		expect(savedChief().inventory).toEqual({});
	});

	it("opens the All items tab from the address and shows the resource totals", async () => {
		routerState.search = "tab=all";
		const chief = withInventory(emptyChief(), { meat: 500, "meat-10k": 3 });
		seed(chief);
		await mount(<ResourcesView chief={chief} />);

		expect(button(/All items/)?.getAttribute("aria-selected")).toBe("true");
		await click(button(/^Resources\d/));

		expect(text()).toContain("30,500");
	});
});

describe("Hero shards section", () => {
	const chief = {
		...veteranChief(),
		heroGenerationUnlocked: 0,
		heroes: { smith: { owned: true, star: 5, tier: 0 } },
	};

	it("hides a hero with every star until the switch is on", async () => {
		seed(chief);
		await mount(<ResourcesView chief={chief} />);
		const sections = [...page().querySelectorAll("details")];
		const shards = sections[sections.length - 1];
		await click(shards.querySelector("summary"));

		expect(field("Smith Shard owned")).toBeNull();
		expect(field("Eugene Shard owned")).not.toBeNull();

		await click(shards.querySelector("[role=switch]"));

		expect(field("Smith Shard owned")).not.toBeNull();
	});

	it("saves a hero shard count to the inventory of the hero", async () => {
		seed(chief);
		await mount(<ResourcesView chief={chief} />);
		const sections = [...page().querySelectorAll("details")];
		await click(sections[sections.length - 1].querySelector("summary"));
		await type(field("Eugene Shard owned"), "33");

		expect(savedChief().inventory?.["eugene-shard"]).toBe(33);
	});
});
