import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL("https://media.formula1.com/**"),
      new URL(
        "https://raw.githubusercontent.com/TracingInsights/2026/94375503dc8e724e7eaae95fe3ca365da238a5dd/images/cars/**"
      ),
    ],
  },
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
