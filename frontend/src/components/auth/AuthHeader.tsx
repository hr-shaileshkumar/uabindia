"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { buildClientProfile } from "@/lib/publicProfile";
import { publicApi } from "@/services/publicApi";

export default function AuthHeader() {
  const [brandName, setBrandName] = useState("Uabindia ERP Tenant Portal");
  const [subtitle, setSubtitle] = useState("Uabindia ERP portal");
  const [logoUrl, setLogoUrl] = useState("/logo.png");

  useEffect(() => {
    let active = true;

    const loadBranding = async () => {
      try {
        const response = await publicApi.getCompanyProfile();
        if (!active) return;

        const profile = buildClientProfile(response.data);
        setLogoUrl(profile.logoUrl || "/logo.png");
        setBrandName(profile.brandName || "Uabindia ERP Tenant Portal");
        setSubtitle(`${profile.companyName || "Uabindia ERP"} portal`);
      } catch {
        if (!active) return;
        setBrandName("Uabindia ERP Tenant Portal");
        setSubtitle("Uabindia ERP portal");
      }
    };

    loadBranding();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/30 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-slate-900 to-slate-700 shadow-lg transition-transform duration-300 hover:-translate-y-0.5">
            <Image
              src={logoUrl}
              alt={`${brandName} logo`}
              width={40}
              height={40}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-900">{brandName}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
