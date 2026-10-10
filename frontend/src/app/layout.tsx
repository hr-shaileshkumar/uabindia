import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ScreenFitController from "@/components/app/ScreenFitController";
import Providers from "./providers";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { publicSiteUrl } from "@/lib/public-site-url";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "UabIndia ERP - Cloud Enterprise Operating System",
    template: "%s | UabIndia ERP",
  },
  metadataBase: new URL(publicSiteUrl),
  description:
    "Modern cloud enterprise platform for HRMS, payroll, finance & accounting, procurement, inventory, projects, and operational intelligence.",
  applicationName: "UabIndia ERP",
  openGraph: {
    siteName: "UabIndia ERP",
    type: "website",
    url: publicSiteUrl,
  },
  icons: {
    icon: "/favicon.ico",
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={plusJakarta.variable}>
      <head />
      <body className="min-h-screen font-sans antialiased text-slate-900 bg-[#f8fafc] dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ScreenFitController />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

