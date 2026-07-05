import type { NextConfig } from "next";
import { withSecurityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default withSecurityHeaders(nextConfig);
