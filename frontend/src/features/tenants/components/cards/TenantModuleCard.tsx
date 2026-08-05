"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

interface ModuleConfig {
  id: string;
  name: string;
  status: "enabled" | "disabled" | "pending";
  description?: string;
}

interface TenantModuleCardProps {
  modules: ModuleConfig[];
}

export function TenantModuleCard({ modules }: TenantModuleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Module Provisioning</CardTitle>
        </div>
        <CardDescription>Active and available modules for this tenant</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.length > 0 ? (
            modules.map((mod) => (
              <div key={mod.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{mod.name}</p>
                  {mod.description && (
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  )}
                </div>
                <Badge 
                  variant={mod.status === "enabled" ? "default" : mod.status === "disabled" ? "secondary" : "outline"}
                  className={mod.status === "enabled" ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80 shadow-none border-transparent" : ""}
                >
                  {mod.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
              No modules assigned to this tenant yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
