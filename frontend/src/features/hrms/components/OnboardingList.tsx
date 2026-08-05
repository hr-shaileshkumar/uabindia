"use client";

import { useState } from "react";
import { UserPlus, CheckCircle, Clock, FileText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface OnboardingCandidate {
  id: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  completedTasks: number;
  totalTasks: number;
  status: "In Progress" | "Completed" | "Pending Docs";
}

const INITIAL_ONBOARDING: OnboardingCandidate[] = [
  { id: "1", name: "Kavya Menon", department: "Engineering & Tech", designation: "Frontend Engineer", joiningDate: "2026-08-10", completedTasks: 6, totalTasks: 8, status: "In Progress" },
  { id: "2", name: "Siddharth Rao", department: "Sales & Marketing", designation: "Account Executive", joiningDate: "2026-08-05", completedTasks: 8, totalTasks: 8, status: "Completed" },
  { id: "3", name: "Neha Gupta", department: "Finance & Accounting", designation: "Senior Accountant", joiningDate: "2026-08-18", completedTasks: 2, totalTasks: 8, status: "Pending Docs" },
];

export function OnboardingList() {
  const [items] = useState<OnboardingCandidate[]>(INITIAL_ONBOARDING);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding & Offboarding Workflows"
        subtitle="Track new hire setup, document verification, equipment allocation, and exit checklists"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Onboarding" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Initiate Onboarding
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const percentage = Math.round((item.completedTasks / item.totalTasks) * 100);
          return (
            <Card key={item.id} className="hover:border-indigo-500/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                    <CardDescription className="text-xs">{item.designation} • {item.department}</CardDescription>
                  </div>
                  <Badge variant={item.status === "Completed" ? "success" : item.status === "In Progress" ? "warning" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Joining Date</span>
                  <span className="font-medium text-foreground">{item.joiningDate}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Checklist Progress</span>
                    <span className="font-semibold text-foreground">{item.completedTasks}/{item.totalTasks} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
