import type { NextConfig } from "next";
import { getServerApiOrigin } from "./src/lib/server-api-base-url";

const normalizedApiBase = getServerApiOrigin();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  generateBuildId: async () =>
    process.env.NEXT_BUILD_ID || `local-${Date.now().toString(36)}`,
  typescript: {
    ignoreBuildErrors: true,
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
      { source: "/employees", destination: "/erp/hrms/employees", permanent: false },
      { source: "/erp", destination: "/context", permanent: false },
      { source: "/dashboard", destination: "/context", permanent: false },
      { source: "/superadmin", destination: "/superadmin/dashboard", permanent: false },
      {
        source:
          "/:module(hrms|payroll|reports|licensing|security|notifications|documents|customers|vendors|items|sales-orders|purchase-orders|chart-of-accounts|journal-entries|payments|warehouses|stock-movements|approvals)",
        destination: "/erp/:module",
        permanent: false,
      },
      {
        source:
          "/:module(hrms|payroll|reports|licensing|security|notifications|documents|customers|vendors|items|sales-orders|purchase-orders|chart-of-accounts|journal-entries|payments|warehouses|stock-movements|approvals)/:path*",
        destination: "/erp/:module/:path*",
        permanent: false,
      },
      { source: "/app/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
