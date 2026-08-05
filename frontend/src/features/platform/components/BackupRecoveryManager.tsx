"use client";

import { useState } from "react";
import { Database, Download, RotateCcw, ShieldCheck, Clock, Plus, HardDrive } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BackupSnapshot {
  id: string;
  name: string;
  type: "Automated Daily" | "Manual Pre-Deploy" | "Disaster Recovery";
  size: string;
  createdAt: string;
  status: "Completed" | "In Progress";
}

const INITIAL_BACKUPS: BackupSnapshot[] = [
  { id: "1", name: "backup_prod_db_20260803_0200.sql.gz", type: "Automated Daily", size: "4.2 GB", createdAt: "2026-08-03 02:00", status: "Completed" },
  { id: "2", name: "backup_prod_db_20260802_0200.sql.gz", type: "Automated Daily", size: "4.1 GB", createdAt: "2026-08-02 02:00", status: "Completed" },
  { id: "3", name: "backup_pre_migration_v2.sql.gz", type: "Manual Pre-Deploy", size: "3.9 GB", createdAt: "2026-07-31 18:30", status: "Completed" },
];

export function BackupRecoveryManager() {
  const [backups] = useState<BackupSnapshot[]>(INITIAL_BACKUPS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Disaster Recovery Center"
        subtitle="Manage automated PostgreSQL database snapshots, file storage backups, recovery schedules, and point-in-time restores"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Backup & Recovery" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Trigger Immediate Backup
          </Button>
        }
      />

      <div className="space-y-3">
        {backups.map((b) => (
          <Card key={b.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-foreground text-sm truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Type: <span className="font-medium text-foreground">{b.type}</span> • Size: {b.size} • Created: {b.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-emerald-600">
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
