import type { Metadata } from "next";
import "./globals.css";
import ScreenFitController from "@/components/app/ScreenFitController";
import Providers from "./providers";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { publicSiteUrl } from "@/lib/public-site-url";

export const metadata: Metadata = {
  title: {
    default: "UabIndia ERP",
    template: "%s | UabIndia ERP",
  },
  metadataBase: new URL(publicSiteUrl),
  description:
    "Modern cloud ERP for HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, help desk, and reporting.",
  applicationName: "UabIndia ERP",
  openGraph: {
    siteName: "UabIndia ERP",
    type: "website",
    url: publicSiteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {nonce && <meta property="csp-nonce" content={nonce} />}
      </head>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ScreenFitController />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

