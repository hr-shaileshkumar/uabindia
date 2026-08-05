"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  status: "completed" | "in_progress" | "failed" | "pending";
}

interface TenantTimelineProps {
  events: TimelineEvent[];
}

export function TenantTimeline({ events }: TenantTimelineProps) {
  const getIcon = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-5 w-5 text-emerald-500 bg-background" />;
      case "in_progress": return <Clock className="h-5 w-5 text-indigo-500 bg-background" />;
      case "failed": return <XCircle className="h-5 w-5 text-red-500 bg-background" />;
      case "pending": return <AlertCircle className="h-5 w-5 text-slate-400 bg-background" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Provisioning Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-border ml-3 space-y-6 pb-2">
          {events.map((event, _index) => (
            <div key={event.id} className="relative pl-6">
              <span className="absolute -left-2.5 top-0.5">
                {getIcon(event.status)}
              </span>
              <div className="flex flex-col space-y-1">
                <span className={cn(
                  "text-sm font-medium",
                  event.status === "pending" ? "text-muted-foreground" : "text-foreground"
                )}>
                  {event.title}
                </span>
                {event.description && (
                  <span className="text-sm text-muted-foreground">{event.description}</span>
                )}
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
