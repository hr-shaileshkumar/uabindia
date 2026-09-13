import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const isVercel = Boolean(process.env.VERCEL);

const apiOrigin = (
  process.env.API_BASE_URL ||
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/i, "");

const frontendRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: frontendRoot,
  turbopack: {
    root: frontendRoot,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  generateBuildId: () => process.env.NEXT_BUILD_ID || "dev",
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(isProd && !isVercel
    ? {
        output: "standalone" as const,
        compress: true,
      }
    : {}),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
      "@tanstack/react-table",
      "@tanstack/react-query",
    ],
  },
  images: {
    unoptimized: true,
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 60 * 1000,
    pagesBufferLength: 8,
  },
  async rewrites() {
    return [
      {
        source: "/health",
        destination: `${apiOrigin}/health`,
      },
      {
        source: "/health/:path*",
        destination: `${apiOrigin}/health/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/hubs/:path*",
        destination: `${apiOrigin}/hubs/:path*`,
      },
      {
        source: "/platform",
        destination: "/administration",
      },
      {
        source: "/platform/:path*",
        destination: "/administration/:path*",
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
      { source: "/hrms/departments", destination: "/administration/departments", permanent: false },
      { source: "/hrms/designations", destination: "/administration/designations", permanent: false },
      { source: "/recruitment", destination: "/hrms/recruitment", permanent: false },
      { source: "/performance", destination: "/hrms/performance", permanent: false },
      { source: "/travel", destination: "/hrms/travel", permanent: false },
      { source: "/tours", destination: "/hrms/travel", permanent: false },
      { source: "/fleet", destination: "/dashboard", permanent: false },
      { source: "/healthcare", destination: "/dashboard", permanent: false },
      { source: "/projects", destination: "/administration/projects", permanent: false },
      { source: "/security/sessions", destination: "/administration/security/sessions", permanent: false },
      { source: "/security/devices", destination: "/administration/security/sessions", permanent: false },
      { source: "/administration/licensing", destination: "/licensing", permanent: false },
      { source: "/customers", destination: "/crm/customers", permanent: false },
      { source: "/customers/:path*", destination: "/crm/customers/:path*", permanent: false },

      // Finance Module Canonical Redirects
      { source: "/chart-of-accounts", destination: "/finance/chart-of-accounts", permanent: false },
      { source: "/journal-entries", destination: "/finance/journal-entries", permanent: false },
      { source: "/bank-reconciliation", destination: "/finance/bank-reconciliation", permanent: false },

      // Inventory Module Canonical Redirects
      { source: "/items", destination: "/inventory/items", permanent: false },
      { source: "/warehouses", destination: "/inventory/warehouses", permanent: false },

      // Procurement Module Canonical Redirects
      { source: "/vendors", destination: "/procurement/vendors", permanent: false },
      { source: "/purchase-orders", destination: "/procurement/purchase-orders", permanent: false },
      { source: "/purchase-requests", destination: "/procurement/purchase-requests", permanent: false },
      { source: "/grn", destination: "/procurement/grn", permanent: false },

      // Sales Module Canonical Redirects
      { source: "/quotations", destination: "/sales/quotations", permanent: false },
      { source: "/discounts", destination: "/sales/discounts", permanent: false },
      { source: "/sales-orders", destination: "/sales/orders", permanent: false },
      { source: "/returns", destination: "/sales/returns", permanent: false },
    ];
  },
};

export default nextConfig;
