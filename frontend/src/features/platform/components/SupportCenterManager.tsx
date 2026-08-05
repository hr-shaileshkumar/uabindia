"use client";

import { useState } from "react";
import { HelpCircle, Ticket, BookOpen, MessageSquare, Plus, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  tenantName: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  { id: "1", ticketNumber: "TCK-8901", subject: "GST Tax Invoice Rounding Offset Issue", tenantName: "Apex Logistics Corp", priority: "High", status: "In Progress", createdAt: "2026-08-03 14:20" },
  { id: "2", ticketNumber: "TCK-8902", subject: "Biometric Attendance API Sync Timeout", tenantName: "Horizon Retail Chains", priority: "Medium", status: "Open", createdAt: "2026-08-03 16:45" },
  { id: "3", ticketNumber: "TCK-8898", subject: "Custom Domain SSL Certificate Renewal", tenantName: "Metro Care Hospitals", priority: "Low", status: "Resolved", createdAt: "2026-08-02 09:10" },
];

export function SupportCenterManager() {
  const [tickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [search, setSearch] = useState("");

  const filtered = tickets.filter((t) => t.subject.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Center & Knowledge Base"
        subtitle="Manage customer support tickets, knowledge articles, release notes, and SLA resolution queues"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Support Center" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket / KB Article
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search ticket ID or subject..." searchValue={search} onSearchChange={setSearch} />

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-foreground text-sm">{t.ticketNumber}</span>
                  <span className="font-semibold text-foreground text-sm">{t.subject}</span>
                  <Badge variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "warning" : "secondary"}>
                    {t.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tenant: <span className="font-medium text-foreground">{t.tenantName}</span> • Submitted: {t.createdAt}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={t.status === "Resolved" ? "success" : t.status === "In Progress" ? "warning" : "outline"}>
                  {t.status}
                </Badge>
                <Button size="sm" variant="outline" className="h-8 text-xs">View Ticket</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
