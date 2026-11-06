import type { Metadata } from "next";
import "./globals.css";
import ScreenFitController from "@/components/app/ScreenFitController";
import UrlLockController from "@/components/app/UrlLockController";
import Providers from "./providers";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { publicSiteUrl } from "@/lib/public-site-url";

const plusJakarta = {
  variable: "font-sans",
  className: "font-sans",
};

export const metadata: Metadata = {
  title: {
    default: "UabIndia - Global Cloud ERP & Multi-Currency HRMS Operating System",
    template: "%s | UabIndia Global ERP",
  },
  metadataBase: new URL(publicSiteUrl),
  description:
    "Sovereign multi-currency cloud enterprise platform for global workforce management, multi-country payroll, connected banking, cross-border tax compliance, and supply chain operations.",
  applicationName: "UabIndia Global Enterprise",
  openGraph: {
    siteName: "UabIndia Global ERP",
    title: "UabIndia - Global Cloud ERP & Multi-Currency HRMS Operating System",
    description:
      "Sovereign multi-currency cloud enterprise platform for global workforce management, multi-country payroll, connected banking, cross-border tax compliance, and supply chain operations.",
    type: "website",
    url: publicSiteUrl,
    images: [
      {
        url: "/assets/pages/home/banner.png",
        width: 1200,
        height: 630,
        alt: "UabIndia Global Cloud ERP & HRMS",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    title: "UabIndia - Global Cloud ERP & Multi-Currency HRMS",
    description:
      "Sovereign multi-currency cloud enterprise platform for global workforce, multi-country payroll, and supply chain operations.",
    images: ["/assets/pages/home/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${plusJakarta.variable} h-full`}>
      <head />
      <body className="min-h-full h-full font-sans antialiased text-slate-900 bg-[#f8fafc] dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ScreenFitController />
          <UrlLockController />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
