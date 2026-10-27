import * as data from "whiteout-survival-data";
import { describe, expect, it } from "vitest";
import manifest from "./ids.manifest.json";

type Manifest = Record<string, Record<string, number>>;

/** The number that the manifest keeps for an id: its levels, or its skills for an expert. */
const sizeOf = (collection: string, item: Record<string, unknown>) => {
  if (collection === "experts") return (item.skills as unknown[]).length;
  return Array.isArray(item.levels) ? item.levels.length : 0;
};

const resolveIds = (collection: string): Map<string, number> => {
  const read = (
    data as unknown as Record<
      string,
      () => { get: () => Record<string, unknown>[] }
    >
  )[collection];
  return new Map(
    read()
      .get()
      .map((item) => [item.id as string, sizeOf(collection, item)]),
  );
};

describe("whiteout-survival-data ids that saves refer to", () => {
  describe.each(Object.entries(manifest as Manifest))(
    "%s",
    (collection, expected) => {
      const current = resolveIds(collection);

      it("still has every id from the manifest", () => {
        const missing = Object.keys(expected).filter((id) => !current.has(id));

        expect(missing).toEqual([]);
      });

      it("still has at least as many levels per id", () => {
        const shrunk = Object.entries(expected).filter(
          ([id, size]) => (current.get(id) ?? 0) < size,
        );

        expect(shrunk).toEqual([]);
      });
    },
  );
});
