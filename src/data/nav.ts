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

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  excludedPaths?: string[];
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Overview", href: "/overview", icon: LuLayoutDashboard }],
  },
  {
    label: "Chief",
    items: [
      { label: "Buildings", href: "/buildings", icon: LuBuilding2 },
      { label: "Daybreak Island", href: "/daybreak-island", icon: LuTreePine },
      { label: "Heroes", href: "/heroes", icon: LuSwords },
      { label: "Chief Gear", href: "/chief-gear", icon: LuShield },
      { label: "Experts", href: "/experts", icon: LuGraduationCap },
      { label: "Pets", href: "/pets", icon: LuPawPrint },
      { label: "Troops", href: "/troops", icon: LuUsers },
      { label: "Research", href: "/research", icon: LuFlaskConical },
    ],
  },
  {
    label: "Alliance",
    items: [
      { label: "Alliance", href: "/alliance", icon: LuHandshake },
      { label: "Facilities", href: "/facilities", icon: LuWarehouse },
      { label: "Tech", href: "/tech", icon: LuCpu },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Resources", href: "/resources", icon: LuPackage },
      { label: "Bonuses", href: "/bonuses", icon: LuTrendingUp },
      { label: "VIP", href: "/vip", icon: LuCrown },
      { label: "Skins", href: "/skins", icon: LuShirt },
      { label: "Events", href: "/events", icon: LuCalendarDays },
      { label: "Tundra Album", href: "/tundra-album", icon: LuImages },
    ],
  },
  {
    label: "Planner",
    items: [
      { label: "Core Events", href: "/core-events", icon: LuTarget },
      { label: "Dailies", href: "/dailies", icon: LuListChecks },
      { label: "History", href: "/history", icon: LuHistory },
    ],
  },
  {
    label: "Wiki",
    items: [
      {
        label: "Reference",
        href: "/wiki",
        icon: LuBookOpen,
        excludedPaths: ["/wiki/timeline"],
      },
      { label: "Timeline", href: "/wiki/timeline", icon: LuMilestone },
    ],
  },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: LuSettings,
};

export const chiefsRoute = { label: "Chiefs", href: "/chiefs" };

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

export const getPageTitle = (pathname: string) => {
  const matches = routes.filter((route) => isPathWithin(pathname, route.href));
  const closest = matches.sort((a, b) => b.href.length - a.href.length)[0];
  return closest?.label ?? APP_NAME;
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
