"use client";

import { useState } from "react";
import { FolderKanban, Plus, Clock, Users, Calendar, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  clientName: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "In Progress" | "Completed" | "Planning" | "On Hold";
  memberCount: number;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  { id: "1", name: "ERP Platform Migration v2.0", code: "PRJ-001", clientName: "Internal / Enterprise", startDate: "2026-05-01", endDate: "2026-09-30", progress: 68, status: "In Progress", memberCount: 12 },
  { id: "2", name: "Healthcare Mobile Clinic Sync", code: "PRJ-002", clientName: "Ministry of Health", startDate: "2026-06-15", endDate: "2026-11-15", progress: 45, status: "In Progress", memberCount: 8 },
  { id: "3", name: "Financial Audit Portal", code: "PRJ-003", clientName: "Apex Global Fin", startDate: "2026-03-01", endDate: "2026-07-15", progress: 100, status: "Completed", memberCount: 6 },
];

export function ProjectList() {
  const [projects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management & Delivery"
        subtitle="Track project milestones, resource allocation, client deliverables, and completion progress"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "All Projects" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search project name or code..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((proj) => (
          <Card key={proj.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{proj.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{proj.code} • {proj.clientName}</CardDescription>
                </div>
                <Badge variant={proj.status === "Completed" ? "success" : proj.status === "In Progress" ? "warning" : "secondary"}>
                  {proj.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Timeline</span>
                <span className="font-medium text-foreground">{proj.startDate} - {proj.endDate}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion Progress</span>
                  <span className="font-bold text-foreground">{proj.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${proj.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-500" /> Team Size</span>
                <span className="font-semibold text-foreground">{proj.memberCount} Members</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
