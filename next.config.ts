import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Exercise/asana line-art is served locally as SVG, so no remote image config needed.
  // The service worker (public/sw.js) is registered client-side for offline support.
};

export default nextConfig;
