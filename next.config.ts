import type { NextConfig } from "next";
import { withSecurityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    proxyClientMaxBodySize: '2gb',
  },
};

export default withSecurityHeaders(nextConfig);
