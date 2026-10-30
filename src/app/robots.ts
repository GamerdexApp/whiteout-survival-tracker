import type { MetadataRoute } from "next";
import { routes } from "@/data/nav";
import { SITE_URL } from "@/data/site";

const trackerPaths = routes
  .map((route) => route.href)
  .filter((href) => !href.startsWith("/wiki"));

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/wiki"],
      disallow: trackerPaths,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
