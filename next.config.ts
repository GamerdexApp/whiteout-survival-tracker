import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
};

export default nextConfig;
