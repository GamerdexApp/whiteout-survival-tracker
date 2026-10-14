import type { MetadataRoute } from "next";

const SITE_URL = "https://whiteout-survival.gamerdex.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/settings/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
