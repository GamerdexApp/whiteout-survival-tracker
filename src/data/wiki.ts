import type { IconType } from "react-icons";
import {
  LuBuilding2,
  LuCalendarDays,
  LuCpu,
  LuCrown,
  LuFlame,
  LuFlaskConical,
  LuGem,
  LuGraduationCap,
  LuImages,
  LuListChecks,
  LuPackage,
  LuPawPrint,
  LuShapes,
  LuShield,
  LuShirt,
  LuSwords,
  LuTreePine,
  LuTrendingUp,
  LuUsers,
  LuWarehouse,
  LuWrench,
} from "react-icons/lu";

export const WIKI_PAGE_IDS = [
  "buildings",
  "fireCrystal",
  "heroes",
  "heroGear",
  "experts",
  "pets",
  "chiefGear",
  "chiefCharms",
  "troops",
  "research",
  "fireCrystalShards",
  "allianceTech",
  "allianceStructures",
  "daybreak",
  "events",
  "eventBuffs",
  "items",
  "skins",
  "vip",
  "tundraAlbum",
  "dailies",
] as const;

export type WikiPageId = (typeof WIKI_PAGE_IDS)[number];

export interface WikiPageInfo {
  id: WikiPageId;
  slug: string;
  icon: IconType;
  /** The tracker page that edits this data. Pages without one have no Open in tracker link. */
  trackerHref?: string;
}

export const wikiPages: WikiPageInfo[] = [
  {
    id: "buildings",
    slug: "buildings",
    icon: LuBuilding2,
    trackerHref: "/buildings",
  },
  {
    id: "fireCrystal",
    slug: "fire-crystal",
    icon: LuFlame,
    trackerHref: "/buildings",
  },
  { id: "heroes", slug: "heroes", icon: LuSwords, trackerHref: "/heroes" },
  { id: "heroGear", slug: "hero-gear", icon: LuWrench, trackerHref: "/heroes" },
  {
    id: "experts",
    slug: "experts",
    icon: LuGraduationCap,
    trackerHref: "/experts",
  },
  { id: "pets", slug: "pets", icon: LuPawPrint, trackerHref: "/pets" },
  {
    id: "chiefGear",
    slug: "chief-gear",
    icon: LuShield,
    trackerHref: "/chief-gear",
  },
  {
    id: "chiefCharms",
    slug: "chief-charms",
    icon: LuGem,
    trackerHref: "/chief-gear",
  },
  { id: "troops", slug: "troops", icon: LuUsers, trackerHref: "/troops" },
  {
    id: "research",
    slug: "research",
    icon: LuFlaskConical,
    trackerHref: "/research",
  },
  {
    id: "fireCrystalShards",
    slug: "fire-crystal-shards",
    icon: LuShapes,
    trackerHref: "/research",
  },
  {
    id: "allianceTech",
    slug: "alliance-tech",
    icon: LuCpu,
    trackerHref: "/tech",
  },
  {
    id: "allianceStructures",
    slug: "alliance-structures",
    icon: LuWarehouse,
    trackerHref: "/facilities",
  },
  {
    id: "daybreak",
    slug: "daybreak-island",
    icon: LuTreePine,
    trackerHref: "/daybreak-island",
  },
  {
    id: "events",
    slug: "events",
    icon: LuCalendarDays,
    trackerHref: "/events",
  },
  { id: "eventBuffs", slug: "event-buffs", icon: LuTrendingUp },
  { id: "items", slug: "items", icon: LuPackage },
  { id: "skins", slug: "skins", icon: LuShirt, trackerHref: "/skins" },
  { id: "vip", slug: "vip", icon: LuCrown, trackerHref: "/vip" },
  {
    id: "tundraAlbum",
    slug: "tundra-album",
    icon: LuImages,
    trackerHref: "/tundra-album",
  },
  {
    id: "dailies",
    slug: "dailies",
    icon: LuListChecks,
    trackerHref: "/dailies",
  },
];

export const wikiPageBySlug = (slug: string) =>
  wikiPages.find((page) => page.slug === slug);

export const wikiPageHref = (id: WikiPageId) =>
  `/wiki/${wikiPages.find((page) => page.id === id)?.slug}`;
