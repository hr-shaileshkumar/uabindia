import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedApiBase}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/employees", destination: "/erp/hrms/employees", permanent: false },
      { source: "/dashboard", destination: "/erp/hrms", permanent: false },
      { source: "/hrms", destination: "/erp/hrms", permanent: false },
      { source: "/hrms/:path*", destination: "/erp/hrms/:path*", permanent: false },
      { source: "/app/:path*", destination: "/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
