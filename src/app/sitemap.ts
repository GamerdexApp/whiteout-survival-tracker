import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";
import { wikiPages } from "@/data/wiki";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/wiki`, changeFrequency: "monthly", priority: 0.8 },
    ...wikiPages.map((page) => ({
      url: `${SITE_URL}/wiki/${page.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${SITE_URL}/wiki/timeline`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
