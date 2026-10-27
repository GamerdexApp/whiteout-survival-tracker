import { beforeEach, describe, expect, it } from "vitest";
import type { ChiefValues } from "@/types/app";
import {
  addChief,
  emptyAppData,
  removeChief,
  restoreChief,
  toChiefValues,
  updateChief,
  updateChiefById,
} from "@/service/chiefs";
import { STORAGE_KEY, storageService } from "@/service/storage";

const values = (name: string): ChiefValues => ({
  name,
  heroGenerationUnlocked: 1,
  coreEventsShown: ["svs"],
});

describe("chiefs", () => {
  it("adds a chief, makes it the active one and stamps its dates", () => {
    const data = addChief(emptyAppData(), values("Frost"));
    const [chief] = data.playthroughs;

    expect(data.playthroughs).toHaveLength(1);
    expect(data.activePlaythroughId).toBe(chief.id);
    expect(chief.createdAt).toBe(chief.lastModified);
    expect(toChiefValues(chief)).toMatchObject(values("Frost"));
  });

  it("keeps the other chiefs when one changes", () => {
    let data = addChief(emptyAppData(), values("First"));
    data = addChief(data, values("Second"));
    const [first, second] = data.playthroughs;
    const changed = updateChief(data, first.id, {
      ...values("Renamed"),
      stateNumber: 12,
    });

    expect(changed.playthroughs[0]).toMatchObject({
      name: "Renamed",
      stateNumber: 12,
    });
    expect(changed.playthroughs[1]).toEqual(second);
  });

  it("changes one chief by id and leaves the data alone when the id is unknown", () => {
    const data = addChief(emptyAppData(), values("Only"));
    const [chief] = data.playthroughs;
    const changed = updateChiefById(data, chief.id, (current) => ({
      ...current,
      notes: "hello",
    }));

    expect(changed?.playthroughs[0].notes).toBe("hello");
  });

  it("removes a chief and moves the active chief on to the latest one left", () => {
    let data = addChief(emptyAppData(), values("First"));
    data = addChief(data, values("Second"));
    const [first, second] = data.playthroughs;
    const removed = removeChief(data, second.id);

    expect(removed.playthroughs.map((chief) => chief.id)).toEqual([first.id]);
    expect(removed.activePlaythroughId).toBe(first.id);
  });

  it("brings a removed chief back, and makes it active again when it was", () => {
    let data = addChief(emptyAppData(), values("First"));
    data = addChief(data, values("Second"));
    const [first, second] = data.playthroughs;
    const removed = removeChief(data, second.id);

    const quiet = restoreChief(removed, second, false);
    expect(quiet.playthroughs.map((chief) => chief.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(quiet.activePlaythroughId).toBe(first.id);
    expect(restoreChief(removed, second, true).activePlaythroughId).toBe(
      second.id,
    );
  });

  it("does not add a chief twice when it is restored twice", () => {
    const data = addChief(emptyAppData(), values("Only"));
    const [chief] = data.playthroughs;

    expect(restoreChief(data, chief, true)).toBe(data);
  });
});

describe("storage service", () => {
  beforeEach(() => localStorage.clear());

  it("reads an empty list when nothing is saved", () => {
    expect(storageService.load().playthroughs).toEqual([]);
  });

  it("saves under one key and reads the same data back", () => {
    const data = addChief(emptyAppData(), values("Saved"));

    expect(storageService.save(data)).toBe(true);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).playthroughs,
    ).toHaveLength(1);
    expect(storageService.load().playthroughs[0].name).toBe("Saved");
  });

  it("returns the same object until the stored text changes", () => {
    storageService.save(addChief(emptyAppData(), values("Same")));

    expect(storageService.load()).toBe(storageService.load());
  });

  it("tells a listener about a save and stops after it unsubscribes", () => {
    let calls = 0;
    const stop = storageService.subscribe(() => (calls += 1));
    storageService.save(emptyAppData());
    stop();
    storageService.save(emptyAppData());

    expect(calls).toBe(1);
  });

  it("falls back to an empty list when the saved text is broken", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(storageService.load().playthroughs).toEqual([]);
  });
});
