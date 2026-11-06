"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Settings, Shield, CreditCard, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "user" | "system" | "billing" | "security";
  message: string;
  timestamp: string;
  actor?: string;
}

interface TenantActivityProps {
  activities: ActivityItem[];
}

export function TenantActivity({ activities }: TenantActivityProps) {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "user": return <User className="h-4 w-4 text-blue-500" />;
      case "system": return <Settings className="h-4 w-4 text-slate-500" />;
      case "billing": return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "security": return <Shield className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest events and changes</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-[300px] w-full px-6 pb-6 overflow-y-auto">
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex flex-col flex-1 space-y-1">
                    <p className="text-sm text-foreground">
                      {activity.actor && <span className="font-semibold">{activity.actor} </span>}
                      {activity.message}
                    </p>
                    <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground pt-8">
                No recent activity to display.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
