"use client";

import { useState } from "react";
import { Briefcase, Plus, Users, UserCheck, ChevronRight, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/types";

interface Stage {
  key: Candidate["status"];
  title: string;
  color: string;
}

const STAGES: Stage[] = [
  { key: "Applied", title: "Applied", color: "border-slate-300 dark:border-slate-700" },
  { key: "Screening", title: "Screening", color: "border-blue-500" },
  { key: "Interview", title: "Interview", color: "border-purple-500" },
  { key: "Offered", title: "Offered", color: "border-amber-500" },
  { key: "Hired", title: "Hired", color: "border-emerald-500" },
];

const INITIAL_CANDIDATES: Candidate[] = [
  { id: "1", fullName: "Arjun Nair", email: "arjun@example.com", phone: "+91 9876543210", status: "Applied", appliedAt: "2026-08-01" },
  { id: "2", fullName: "Meera Krishnan", email: "meera@example.com", phone: "+91 9876543211", status: "Screening", appliedAt: "2026-07-28" },
  { id: "3", fullName: "Deepak Joshi", email: "deepak@example.com", phone: "+91 9876543212", status: "Interview", appliedAt: "2026-07-25" },
  { id: "4", fullName: "Rohan Kapoor", email: "rohan@example.com", phone: "+91 9876543213", status: "Offered", appliedAt: "2026-07-20" },
  { id: "5", fullName: "Simran Kaur", email: "simran@example.com", phone: "+91 9876543214", status: "Hired", appliedAt: "2026-07-15" },
];

export function RecruitmentPipeline() {
  const [candidates] = useState<Candidate[]>(INITIAL_CANDIDATES);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment & Applicant Pipeline"
        subtitle="Track candidates through application stages, screening, interviews & offers"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Recruitment" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        }
      />

      {/* Kanban Board Columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-start overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.status === stage.key);
          return (
            <div key={stage.key} className="space-y-3 min-w-[200px]">
              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${stage.color} bg-card border shadow-sm`}>
                <span className="text-sm font-semibold text-foreground">{stage.title}</span>
                <Badge variant="secondary">{stageCandidates.length}</Badge>
              </div>

              <div className="space-y-3">
                {stageCandidates.map((cand) => (
                  <Card key={cand.id} className="hover:border-indigo-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-3.5 space-y-2 text-xs">
                      <p className="font-semibold text-foreground text-sm">{cand.fullName}</p>
                      <div className="space-y-1 text-muted-foreground">
                        {cand.email && <p className="truncate">{cand.email}</p>}
                        {cand.phone && <p>{cand.phone}</p>}
                      </div>
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">Applied: {cand.appliedAt}</p>
                    </CardContent>
                  </Card>
                ))}

                {stageCandidates.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground italic rounded-lg border border-dashed border-border">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
