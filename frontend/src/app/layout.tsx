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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ScreenFitController />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
