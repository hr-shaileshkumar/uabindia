"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicAuthAlertProps = {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
};

export default function PublicAuthAlert({ tone, children }: PublicAuthAlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm leading-relaxed",
        tone === "error" && "bg-rose-50 text-rose-700",
        tone === "success" && "bg-emerald-50 text-emerald-800",
        tone === "info" && "bg-slate-100 text-slate-700",
      )}
    >
      {tone === "error" ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
      ) : tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : null}
      <span>{children}</span>
    </div>
  );
}
