import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pinned so a stray lock file above the repo cannot be inferred as the root.
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
