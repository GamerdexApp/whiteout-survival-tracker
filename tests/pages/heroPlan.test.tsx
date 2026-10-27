import { afterEach, describe, expect, it, vi } from "vitest";
import type { Playthrough } from "@/types/app";
import { HeroPlanFlyout } from "@/comps/heroes/HeroPlanFlyout";
import { emptyChief, withInventory } from "../storage/fixtures";
import { button, click, field, Live, mount, page, seed, text, type, unmount } from "./harness";

afterEach(unmount);

const chief = (): Playthrough =>
	withInventory(
		{
			...emptyChief(),
			heroGenerationUnlocked: 1,
			heroes: { eugene: { owned: true, star: 0 }, smith: { owned: true, star: 5, tier: 0 } },
		},
		{ gems: 10_000, "lucky-chip": 3 }
	);

const open = (onSave = vi.fn()) => {
	seed(chief());
	return mount(
		<Live>
			{(live) => (
				<HeroPlanFlyout
					open
					chief={live}
					focusHeroId={null}
					onClose={() => {}}
					onSave={onSave}
				/>
			)}
		</Live>
	);
};

const addEugene = async () => {
	await click(button(/^Add hero/));
	for (let i = 0; i < 4; i += 1) await click(button("Raise Eugene star goal"));
};

describe("Hero plan", () => {
	it("leaves a hero with every star out of the list of heroes to add", async () => {
		await open();
		const options = [...page().querySelectorAll("[role=option]")].map(
			(item) => item.textContent
		);
		await click(button("Hero to add"));
		const listed = [...page().querySelectorAll("[role=option]")].map(
			(item) => item.textContent
		);

		expect(options).toEqual([]);
		expect(listed.some((label) => label?.includes("Eugene"))).toBe(true);
		expect(listed.some((label) => label?.includes("Smith"))).toBe(false);
	});

	it("shows a rarity, a generation and a class for each hero in the list", async () => {
		await open();
		await click(button("Hero to add"));
		const eugene = [...page().querySelectorAll("[role=option]")].find((item) =>
			item.textContent?.includes("Eugene")
		)!;

		expect(eugene.textContent).toContain("G0");
		expect(eugene.textContent).toMatch(/infantry/i);
		expect(eugene.querySelector(".bg-added")).not.toBeNull();
	});

	it("starts the lucky wheel tokens from the Lucky Chips on the Resources page", async () => {
		await open();
		await addEugene();

		expect(field("Starting tokens")?.value).toBe("3");
	});

	it("estimates the shards and the gems for the planned spins", async () => {
		await open();
		await addEugene();
		await type(field("Spins (up to 150)"), "20");

		expect(text()).toContain("Estimated shards for Eugene: 25");
		expect(text()).toContain("Gems needed: 24,000");
	});

	it("keeps the spins at 150 or fewer", async () => {
		await open();
		await addEugene();
		await type(field("Spins (up to 150)"), "999");

		expect(field("Spins (up to 150)")?.value).toBe("150");
	});

	it("adds the gems to the stock check against the Gems held", async () => {
		await open();
		await addEugene();
		await type(field("Spins (up to 150)"), "20");

		expect(text()).toMatch(/Gems[\s\S]*Short by 14,000/);
	});

	it("saves the wheel with the plan", async () => {
		const onSave = vi.fn();
		await open(onSave);
		await addEugene();
		await type(field("Spins (up to 150)"), "20");
		await click(button("Save plan"));

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0][1]).toEqual({ heroId: "eugene", spins: 20, tokens: 3 });
	});

	it("does not save a wheel with no spins", async () => {
		const onSave = vi.fn();
		await open(onSave);
		await addEugene();
		await click(button("Save plan"));

		expect(onSave.mock.calls[0][1]).toBeUndefined();
	});
});
