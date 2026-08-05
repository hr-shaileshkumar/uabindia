"use client";

import { useState } from "react";
import { Users, Plus, Phone, Mail, Building, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/types";

const INITIAL_LEADS: Lead[] = [
  { id: "1", name: "Enterprise ERP Expansion", company: "Apex Logistics Corp", email: "vikram@apexlogistics.com", value: 1200000, status: "Negotiation" },
  { id: "2", name: "Payroll SaaS Implementation", company: "Horizon Retail Chains", email: "priya@horizonretail.com", value: 450000, status: "Qualified" },
  { id: "3", name: "Hospital Fleet Tracking Systems", company: "Metro Care Hospitals", email: "ksrao@metrocare.org", value: 2800000, status: "New" },
];

export function LeadList() {
  const [leads] = useState<Lead[]>(INITIAL_LEADS);
  const [search, setSearch] = useState("");

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Sales Pipeline"
        subtitle="Track sales leads, customer opportunities, deal values, and conversion stages"
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Leads & Opportunities" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead Opportunity
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search deal title or company..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lead) => (
          <Card key={lead.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{lead.name}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Building className="h-3 w-3" /> {lead.company}
                  </CardDescription>
                </div>
                <Badge variant={lead.status === "Negotiation" ? "warning" : lead.status === "Qualified" ? "success" : "secondary"}>
                  {lead.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Email</span>
                <span className="font-medium text-foreground truncate max-w-[160px]">{lead.email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Estimated Deal Value</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">₹{lead.value?.toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
