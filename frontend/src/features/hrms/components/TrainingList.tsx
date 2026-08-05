"use client";

import { useState } from "react";
import { BookOpen, Plus, Users, Calendar, Award } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TrainingProgram {
  id: string;
  title: string;
  trainer: string;
  category: string;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Ongoing" | "Completed";
}

const INITIAL_TRAININGS: TrainingProgram[] = [
  { id: "1", title: "Enterprise Security & Compliance 2026", trainer: "Security Team", category: "Compliance", enrolledCount: 140, startDate: "2026-08-10", endDate: "2026-08-15", status: "Upcoming" },
  { id: "2", title: "Advanced React & Next.js Performance", trainer: "Frontend Lead", category: "Technical", enrolledCount: 22, startDate: "2026-07-20", endDate: "2026-08-05", status: "Ongoing" },
  { id: "3", title: "Leadership & Management Development", trainer: "External Coach", category: "Soft Skills", enrolledCount: 15, startDate: "2026-06-01", endDate: "2026-07-15", status: "Completed" },
];

export function TrainingList() {
  const [trainings] = useState<TrainingProgram[]>(INITIAL_TRAININGS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & L&D Programs"
        subtitle="Manage employee skill development, workshops, and compliance courses"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Training" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Program
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainings.map((prog) => (
          <Card key={prog.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold">{prog.title}</CardTitle>
                <Badge variant={prog.status === "Ongoing" ? "success" : prog.status === "Upcoming" ? "warning" : "secondary"}>
                  {prog.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">Trainer: {prog.trainer}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-indigo-500" /> Duration</span>
                <span className="font-medium text-foreground">{prog.startDate} - {prog.endDate}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-indigo-500" /> Enrolled</span>
                <span className="font-semibold text-foreground">{prog.enrolledCount} Employees</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
