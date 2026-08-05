"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantStorageCardProps {
  usedStorageGb: number;
  totalStorageGb: number;
}

export function TenantStorageCard({ usedStorageGb, totalStorageGb }: TenantStorageCardProps) {
  const percentage = Math.min(100, Math.round((usedStorageGb / totalStorageGb) * 100)) || 0;
  
  let statusColor = "bg-emerald-500";
  if (percentage > 80) statusColor = "bg-amber-500";
  if (percentage > 95) statusColor = "bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Storage Usage</CardTitle>
        </div>
        <CardDescription>Disk and database storage utilization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Total Usage</span>
            <span className="font-bold">{percentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500 ease-in-out", statusColor)} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{usedStorageGb.toFixed(2)} GB used</span>
            <span>{totalStorageGb} GB total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-md">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Database</p>
              <p className="text-sm font-semibold">{(usedStorageGb * 0.4).toFixed(2)} GB</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-md">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Files & Media</p>
              <p className="text-sm font-semibold">{(usedStorageGb * 0.6).toFixed(2)} GB</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
