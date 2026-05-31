import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
        source: "/api/:path*",
        destination: `${normalizedApiBase}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/employees", destination: "/erp/hrms/employees", permanent: false },
      { source: "/erp", destination: "/erp/dashboard", permanent: false },
      { source: "/dashboard", destination: "/erp/dashboard", permanent: false },
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
