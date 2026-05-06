import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // This turns off the service worker during local development so you can see your code changes instantly
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Satisfies Next.js 16 requirements to silence the Turbopack error
  turbopack: {},
};

export default withSerwist(nextConfig);