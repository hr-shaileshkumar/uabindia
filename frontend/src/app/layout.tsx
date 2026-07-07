import type { Metadata } from "next";
import "./globals.css";
import ScreenFitController from "@/components/app/ScreenFitController";
import Providers from "./providers";
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
    <html lang="en">
      <body className="min-h-screen">
        <ScreenFitController />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
