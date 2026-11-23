"use client";

import { PricingLandingPage } from "@/components/public/pages/PublicMarketingPages";
import type { PublicAudience } from "@/lib/public-audience";

export default function PlatformPricingPage({ audience = "platform" }: { audience?: PublicAudience }) {
  return <PricingLandingPage audience={audience} />;
}
