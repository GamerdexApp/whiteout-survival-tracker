import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

/** The desktop app runs a static export. A static export has no server, so it has no redirects and no image resizing. */
const packageBuild = process.env.GAMERDEX_PACKAGE === "1";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  ...(packageBuild
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {
        async redirects() {
          return [
            {
              source: "/history/:event/:entryId",
              destination: "/history/entry?event=:event&entry=:entryId",
              permanent: true,
            },
          ];
        },
      }),
};

export default nextConfig;
