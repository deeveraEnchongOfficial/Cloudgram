import type { NextConfig } from "next";
import { withSecurityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withSecurityHeaders(nextConfig);
