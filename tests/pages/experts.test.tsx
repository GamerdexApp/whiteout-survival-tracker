import { afterEach, describe, expect, it } from "vitest";
import type { Playthrough } from "@/types/app";
import { ExpertsView } from "@/comps/experts/ExpertsView";
import { veteranChief } from "../storage/fixtures";
import { button, click, Live, mount, page, savedChief, seed, text, unmount } from "./harness";

afterEach(unmount);

const cyrille = (skills: number[]): Playthrough => ({
	...veteranChief(),
	experts: { cyrille: { recruited: true, affinity: 40, advanced: true, skills } },
});

const mountExperts = (chief: Playthrough) => {
	seed(chief);
	return mount(<Live>{(live) => <ExpertsView chief={live} />}</Live>);
};

const step = (verb: "Raise" | "Lower", skill: string) => button(`${verb} Cyrille ${skill} level`);

describe("Experts page skill rules", () => {
	it("takes away the raise button of a skill whose total skill level is not met", async () => {
		await mountExperts(cyrille([7, 2, 4, 1]));

		expect(step("Raise", "Weapon Master")).toBeUndefined();
		expect(text()).toContain("Level 5 needs a total skill level of 15. Now 14.");
	});

	it("opens the skill once another skill adds the total it needs", async () => {
		await mountExperts(cyrille([7, 2, 4, 1]));

		await click(step("Raise", "Ursa's Bane"));

		expect(step("Raise", "Weapon Master")).toBeDefined();
		expect(text()).not.toContain("Level 5 needs a total skill level of 15");
	});

	it("keeps a skill from dropping below the level another skill needs", async () => {
		await mountExperts(cyrille([7, 2, 4, 2]));
		await click(step("Raise", "Weapon Master"));

		expect(step("Lower", "Ursa's Bane")).toBeUndefined();
		expect(step("Lower", "Entrapment")).toBeUndefined();
		expect(step("Lower", "Weapon Master")).toBeDefined();
	});

	it("saves the level that the stepper reaches", async () => {
		await mountExperts(cyrille([7, 2, 4, 1]));
		await click(step("Raise", "Ursa's Bane"));

		expect(savedChief().experts?.cyrille.skills?.[3]).toBe(2);
	});

	it("shows an expert as one card in a grid of cards", async () => {
		await mountExperts(cyrille([1, 0, 0, 0]));
		const list = page().querySelector("ul.grid");

		expect(list).not.toBeNull();
		expect(list!.className).toContain("lg:grid-cols-2");
	});
});
