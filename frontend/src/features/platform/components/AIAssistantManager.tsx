"use client";

import { useState } from "react";
import { Bot, Sparkles, MessageSquare, Cpu, Zap, Plus, Search, Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AIPromptTemplate {
  id: string;
  title: string;
  category: "HR & Hiring" | "Finance Audit" | "Customer Support" | "Supply Chain";
  model: string;
  usageCount: number;
}

const INITIAL_PROMPTS: AIPromptTemplate[] = [
  { id: "1", title: "Automated Resume Screening & Candidate Match", category: "HR & Hiring", model: "Gemini Pro 1.5", usageCount: 1420 },
  { id: "2", title: "Anomalous Journal Entry Fraud Detection", category: "Finance Audit", model: "Gemini Flash 1.5", usageCount: 890 },
  { id: "3", title: "Customer Support Inquiry Smart Reply", category: "Customer Support", model: "Gemini Pro 1.5", usageCount: 3200 },
  { id: "4", title: "Warehouse Stock Outage Risk Predictor", category: "Supply Chain", model: "Gemini Ultra", usageCount: 640 },
];

export function AIAssistantManager() {
  const [prompts] = useState<AIPromptTemplate[]>(INITIAL_PROMPTS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise AI Copilot & Automation Platform"
        subtitle="Manage AI assistant prompts, Model configurations (Gemini/OpenAI), token quotas, and automated workflow triggers"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "AI Platform" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt Template
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total AI Queries" value="48,290" description="This Month" icon={<Sparkles className="h-4 w-4 text-purple-500" />} trend={{ value: "18.4%", positive: true }} />
        <StatCard title="Active Copilot Users" value="342 Users" description="Cross-tenant" icon={<Bot className="h-4 w-4 text-indigo-500" />} />
        <StatCard title="Token Quota Usage" value="1.2M / 10M" description="Monthly Allocation" icon={<Cpu className="h-4 w-4 text-emerald-500" />} />
        <StatCard title="Avg Latency" value="380 ms" description="Model Inference" icon={<Zap className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {prompts.map((p) => (
          <Card key={p.id} className="hover:border-purple-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    {p.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{p.category} • Model: {p.model}</CardDescription>
                </div>
                <Badge variant="outline">{p.usageCount} Runs</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="ghost" className="text-xs h-8">Test Prompt</Button>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1"><Settings className="h-3 w-3" /> Edit Config</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
