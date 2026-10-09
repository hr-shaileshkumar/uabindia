"use client";

import {
  Bot,
  Sparkles,
  MessageSquare,
  BarChart3,
  FileSearch,
  Lightbulb,
  Zap,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/ai/assistant", label: "AI Assistant", icon: MessageSquare, desc: "Chat-based ERP assistant and data queries" },
  { href: "/ai/insights", label: "Business Insights", icon: Lightbulb, desc: "AI-generated business recommendations" },
  { href: "/ai/anomalies", label: "Anomaly Detection", icon: Zap, desc: "Unusual patterns in financial and HR data" },
  { href: "/ai/reports", label: "AI Report Builder", icon: BarChart3, desc: "Natural language to reports" },
  { href: "/ai/search", label: "Semantic Search", icon: FileSearch, desc: "Search across all ERP data intelligently" },
];

export default function AiPage() {
  return (
    <UabModuleDashboard
      moduleKey="ai"
      title="AI & Intelligence"
      subtitle="AI-powered assistant, business insights, anomaly detection, and intelligent search."
      eyebrow="Artificial Intelligence"
      icon={Bot}
      color="from-fuchsia-600 via-purple-600 to-violet-600"
      links={LINKS}
      linksTitle="AI Capabilities"
    />
  );
}
