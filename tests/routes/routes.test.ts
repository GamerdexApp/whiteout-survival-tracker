import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chiefsRoute, navGroups, routes, settingsNavItem } from "@/data/nav";

const ROUTE_GROUP = /^\(.*\)$/;

const pagePaths = (directory: string, segments: string[] = []): string[] =>
  readdirSync(directory).flatMap((name) => {
    const entry = path.join(directory, name);
    if (!statSync(entry).isDirectory()) {
      return name === "page.tsx" ? [`/${segments.join("/")}`] : [];
    }
    return pagePaths(
      entry,
      ROUTE_GROUP.test(name) ? segments : [...segments, name],
    );
  });

const appPages = new Set(
  pagePaths(path.resolve(import.meta.dirname, "../../src/app")),
);

const trackerHrefs = [
  ...navGroups
    .filter((group) => group.id !== "wiki")
    .flatMap((group) => group.items.map((item) => item.href)),
  settingsNavItem.href,
  chiefsRoute.href,
];

/** Pages that people reach from another page or from a redirect, not from the sidebar. */
const REACHED_ANOTHER_WAY = ["/history/[event]/[entryId]", "/sync/callback"];

describe("navigation", () => {
  it("links only to pages that exist", () => {
    const missing = trackerHrefs.filter((href) => !appPages.has(href));

    expect(missing).toEqual([]);
  });

  it("lists each page once", () => {
    const hrefs = routes.map((route) => route.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("lists every page in the sidebar except the ones reached another way", () => {
    const unlisted = [...appPages].filter(
      (page) =>
        page !== "/" &&
        !page.startsWith("/wiki") &&
        !trackerHrefs.includes(page) &&
        !REACHED_ANOTHER_WAY.includes(page),
    );

    expect(unlisted).toEqual([]);
  });
});
