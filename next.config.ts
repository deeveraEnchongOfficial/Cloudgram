import type { NextConfig } from "next";
import { withSecurityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSecurityHeaders(nextConfig);
