"use client";

import { useState } from "react";
import { Link2, Key, Webhook, ShieldCheck, CheckCircle2, RefreshCw, ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface IntegrationConnector {
  id: string;
  name: string;
  category: "Payment Gateway" | "ERP / Accounting" | "Cloud Storage" | "Mapping / GIS" | "Productivity";
  provider: string;
  status: "Connected" | "Configured" | "Available";
  lastSync: string;
}

const INITIAL_CONNECTORS: IntegrationConnector[] = [
  { id: "1", name: "Razorpay / Stripe Payment Gateway", category: "Payment Gateway", provider: "Razorpay Inc", status: "Connected", lastSync: "2026-08-03 22:15" },
  { id: "2", name: "SAP S/4HANA Connector", category: "ERP / Accounting", provider: "SAP SE", status: "Configured", lastSync: "2026-08-02 18:00" },
  { id: "3", name: "Tally Prime Financial Sync", category: "ERP / Accounting", provider: "Tally Solutions", status: "Connected", lastSync: "2026-08-03 20:30" },
  { id: "4", name: "Google Maps & Location API", category: "Mapping / GIS", provider: "Google Cloud", status: "Connected", lastSync: "2026-08-03 23:00" },
  { id: "5", name: "Microsoft 365 & Azure AD SSO", category: "Productivity", provider: "Microsoft Corp", status: "Connected", lastSync: "2026-08-03 12:00" },
  { id: "6", name: "Amazon S3 Document Vault", category: "Cloud Storage", provider: "AWS", status: "Connected", lastSync: "2026-08-03 21:45" },
];

export function IntegrationHubManager() {
  const [connectors] = useState<IntegrationConnector[]>(INITIAL_CONNECTORS);
  const [search, setSearch] = useState("");

  const filtered = connectors.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Hub & API Gateway"
        subtitle="Manage 3rd-party connectors (SAP, Tally, Stripe, M365, AWS), Webhook endpoints, and OAuth2 API Keys"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Integration Hub" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Generate API Key / Webhook
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search integration name or category..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((conn) => (
          <Card key={conn.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{conn.name}</CardTitle>
                  <CardDescription className="text-xs">{conn.provider} • {conn.category}</CardDescription>
                </div>
                <Badge variant={conn.status === "Connected" ? "success" : "warning"}>
                  {conn.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last Sync Signal</span>
                <span className="font-mono text-foreground">{conn.lastSync}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button size="sm" variant="ghost" className="h-8 text-xs px-2">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-sync
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs px-2 gap-1">
                  Configure <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
