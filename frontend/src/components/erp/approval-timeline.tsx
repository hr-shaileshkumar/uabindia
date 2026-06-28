import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";
import { StatusBadge } from "@/components/erp/status-badge";

const iconMap = {
  done: CheckCircle2,
  active: Clock3,
  queued: CircleDashed,
};

const toneMap = {
  done: "positive" as const,
  active: "info" as const,
  queued: "warning" as const,
};

export function ApprovalTimeline({
  items,
}: {
  items: Array<{ title: string; owner: string; time: string; status: "done" | "active" | "queued" }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950">Approval timeline</h3>
        <StatusBadge tone="info">Workflow</StatusBadge>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => {
          const Icon = iconMap[item.status];
          return (
            <div key={`${item.title}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
                {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
              </div>
              <div className="pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <StatusBadge tone={toneMap[item.status]}>{item.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.owner}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
