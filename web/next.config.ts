import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When running locally with Elysia server, uncomment the rewrite below:
  // async rewrites() {
  //   return [{ source: "/api/:path*", destination: "http://localhost:4000/api/:path*" }];
  // },
};

export default nextConfig;
