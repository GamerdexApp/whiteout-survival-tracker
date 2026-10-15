import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuBuilding2,
  LuCalendarDays,
  LuCpu,
  LuCrown,
  LuFlaskConical,
  LuGraduationCap,
  LuHandshake,
  LuHistory,
  LuImages,
  LuLayoutDashboard,
  LuListChecks,
  LuMilestone,
  LuPackage,
  LuPawPrint,
  LuSettings,
  LuShield,
  LuShirt,
  LuSwords,
  LuTarget,
  LuTreePine,
  LuTrendingUp,
  LuUsers,
  LuWarehouse,
} from "react-icons/lu";

export const APP_NAME = "Whiteout Survival Tracker";

export type NavItemId =
  | "overview"
  | "buildings"
  | "daybreakIsland"
  | "heroes"
  | "chiefGear"
  | "experts"
  | "pets"
  | "troops"
  | "research"
  | "alliance"
  | "facilities"
  | "tech"
  | "resources"
  | "bonuses"
  | "vip"
  | "skins"
  | "events"
  | "tundraAlbum"
  | "coreEvents"
  | "dailies"
  | "history"
  | "wikiReference"
  | "wikiTimeline"
  | "settings";

export type RouteId = NavItemId | "chiefs";

export type NavGroupId = "chief" | "alliance" | "account" | "planner" | "wiki";

export interface NavItem {
  id: NavItemId;
  href: string;
  icon: IconType;
  excludedPaths?: string[];
}

export interface NavGroup {
  id: NavGroupId | null;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    id: null,
    items: [{ id: "overview", href: "/overview", icon: LuLayoutDashboard }],
  },
  {
    id: "chief",
    items: [
      { id: "buildings", href: "/buildings", icon: LuBuilding2 },
      { id: "daybreakIsland", href: "/daybreak-island", icon: LuTreePine },
      { id: "heroes", href: "/heroes", icon: LuSwords },
      { id: "chiefGear", href: "/chief-gear", icon: LuShield },
      { id: "experts", href: "/experts", icon: LuGraduationCap },
      { id: "pets", href: "/pets", icon: LuPawPrint },
      { id: "troops", href: "/troops", icon: LuUsers },
      { id: "research", href: "/research", icon: LuFlaskConical },
    ],
  },
  {
    id: "alliance",
    items: [
      { id: "alliance", href: "/alliance", icon: LuHandshake },
      { id: "facilities", href: "/facilities", icon: LuWarehouse },
      { id: "tech", href: "/tech", icon: LuCpu },
    ],
  },
  {
    id: "account",
    items: [
      { id: "resources", href: "/resources", icon: LuPackage },
      { id: "bonuses", href: "/bonuses", icon: LuTrendingUp },
      { id: "vip", href: "/vip", icon: LuCrown },
      { id: "skins", href: "/skins", icon: LuShirt },
      { id: "events", href: "/events", icon: LuCalendarDays },
      { id: "tundraAlbum", href: "/tundra-album", icon: LuImages },
    ],
  },
  {
    id: "planner",
    items: [
      { id: "coreEvents", href: "/core-events", icon: LuTarget },
      { id: "dailies", href: "/dailies", icon: LuListChecks },
      { id: "history", href: "/history", icon: LuHistory },
    ],
  },
  {
    id: "wiki",
    items: [
      {
        id: "wikiReference",
        href: "/wiki",
        icon: LuBookOpen,
        excludedPaths: ["/wiki/timeline"],
      },
      { id: "wikiTimeline", href: "/wiki/timeline", icon: LuMilestone },
    ],
  },
];

export const settingsNavItem: NavItem = {
  id: "settings",
  href: "/settings",
  icon: LuSettings,
};

export const chiefsRoute = { id: "chiefs" as const, href: "/chiefs" };

const navItems = [
  ...navGroups.flatMap((group) => group.items),
  settingsNavItem,
];

export const routes = [...navItems, chiefsRoute];

const isPathWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const isNavItemActive = (item: NavItem, pathname: string) =>
  isPathWithin(pathname, item.href) &&
  !item.excludedPaths?.some((excluded) => isPathWithin(pathname, excluded));

export const getPageRouteId = (pathname: string) => {
  const matches = routes.filter((route) => isPathWithin(pathname, route.href));
  const closest = matches.sort((a, b) => b.href.length - a.href.length)[0];
  return closest?.id ?? null;
};

const editDistance = (a: string, b: string) => {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length];
};

const MAX_SUGGESTION_DISTANCE = 2;

export const suggestRoute = (pathname: string) => {
  const ranked = routes
    .map((route) => ({ route, distance: editDistance(pathname, route.href) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  return best && best.distance <= MAX_SUGGESTION_DISTANCE ? best.route : null;
};
