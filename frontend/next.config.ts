import type { NextConfig } from "next";
import { getServerApiOrigin } from "./src/lib/server-api-base-url";
import path from "path";

const normalizedApiBase = getServerApiOrigin();
const rootDir = process.env.VERCEL ? undefined : path.resolve(__dirname);

const nextConfig: NextConfig = {
  ...(rootDir
    ? {
        turbopack: {
          root: rootDir,
        },
        outputFileTracingRoot: rootDir,
      }
    : {}),
  generateBuildId: async () =>
    process.env.NEXT_BUILD_ID || `local-${Date.now().toString(36)}`,
  typescript: {
    ignoreBuildErrors: false,
  },
  compress: true,
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/erp",
        destination: "/",
      },
      {
        source: "/erp/:path*",
        destination: "/:path*",
      },
      {
        source: "/health",
        destination: normalizedApiBase ? `${normalizedApiBase}/health` : "http://127.0.0.1:5000/health",
      },
      {
        source: "/health/:path*",
        destination: normalizedApiBase ? `${normalizedApiBase}/health/:path*` : "http://127.0.0.1:5000/health/:path*",
      },
      {
        source: "/api/v1/:path*",
        destination: normalizedApiBase ? `${normalizedApiBase}/api/v1/:path*` : "http://127.0.0.1:5000/api/v1/:path*",
      },
      {
        source: "/api/:path*",
        destination: normalizedApiBase ? `${normalizedApiBase}/api/:path*` : "http://127.0.0.1:5000/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      { source: "/employees", destination: "/hrms/employees", permanent: false },
      { source: "/erp", destination: "/context", permanent: false },
      { source: "/erp/:path*", destination: "/:path*", permanent: false },
      { source: "/superadmin", destination: "/superadmin/dashboard", permanent: false },
      { source: "/app/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
