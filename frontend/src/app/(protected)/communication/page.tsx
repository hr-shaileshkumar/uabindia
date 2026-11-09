"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Bell, Radio, MessageSquare, ArrowRightLeft } from "lucide-react";
import { CommunicationBroadcastStudio } from "@/features/communication/components/CommunicationBroadcastStudio";
import { NotificationCenterStudio } from "@/features/notifications/components/NotificationCenterStudio";
import { cn } from "@/lib/utils";

function UnifiedCommunicationCenter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab")?.toLowerCase();

  const [activeTab, setActiveTab] = useState<"broadcast" | "feed">(() => {
    if (tabParam === "feed" || tabParam === "notifications") return "feed";
    return "broadcast";
  });

  useEffect(() => {
    if (tabParam === "feed" || tabParam === "notifications") setActiveTab("feed");
    else if (tabParam === "broadcast") setActiveTab("broadcast");
  }, [tabParam]);

  const handleTabChange = (tab: "broadcast" | "feed") => {
    setActiveTab(tab);
    router.replace(`/communication?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      {/* ── Top-level Unified Communication Hub Navigation ── */}
      <div className="bg-card border border-border/80 rounded-2xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange("broadcast")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "broadcast"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Radio className="w-3.5 h-3.5 text-blue-500" />
            Broadcast Campaigns &amp; Templates
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("feed")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "feed"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            Live In-App Notification Feed
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground pr-2 font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>Omnichannel Communication Engine</span>
        </div>
      </div>

      {/* ── Active Hub Component ── */}
      {activeTab === "broadcast" && <CommunicationBroadcastStudio />}
      {activeTab === "feed" && <NotificationCenterStudio />}
    </div>
  );
}

export default function CommunicationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading Communication Hub...</div>}>
      <UnifiedCommunicationCenter />
    </Suspense>
  );
}
