import type { Metadata } from "next";
import "./globals.css";
import ScreenFitController from "@/components/app/ScreenFitController";
import Providers from "./providers";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { publicSiteUrl } from "@/lib/public-marketing";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
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
