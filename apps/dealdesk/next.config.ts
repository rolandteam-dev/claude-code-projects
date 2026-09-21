import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default builder in Next 16. Pin the root explicitly: this
  // app sits inside a repo that has its own lockfile, and root inference picks
  // the wrong directory otherwise.
  turbopack: { root: process.cwd() },
  // Compile-time checking of every <Link href> and router push.
  typedRoutes: true,
};

export default nextConfig;
