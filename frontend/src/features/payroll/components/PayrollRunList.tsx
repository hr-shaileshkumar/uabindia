"use client";

import { useState } from "react";
import { Play, FileText, CheckCircle, Clock, AlertCircle, Plus, Download } from "lucide-react";
import { PageHeader } from "@/design-system";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PayrollRun } from "@/types";

const INITIAL_RUNS: PayrollRun[] = [
  { id: "1", month: 7, year: 2026, status: "Approved", totalGross: 4850000, totalDeductions: 620000, totalNet: 4230000, employeeCount: 142, processedAt: "2026-07-28" },
  { id: "2", month: 6, year: 2026, status: "Paid", totalGross: 4720000, totalDeductions: 605000, totalNet: 4115000, employeeCount: 139, processedAt: "2026-06-27" },
  { id: "3", month: 5, year: 2026, status: "Paid", totalGross: 4680000, totalDeductions: 598000, totalNet: 4082000, employeeCount: 138, processedAt: "2026-05-28" },
];

export function PayrollRunList() {
  const [runs] = useState<PayrollRun[]>(INITIAL_RUNS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Execution Runs"
        subtitle="Initiate, review, approve and finalize monthly salary processing runs."
        eyebrow="Payroll / Runs"
        icon="bank"
        stats={[
          { label: "Execution Runs", value: runs.length },
          { label: "Approved Runs", value: runs.filter((r) => r.status === "Approved" || r.status === "Paid").length, tone: "success" },
        ]}
        actions={
          <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm gap-1.5">
            <Play className="h-4 w-4" />
            Process New Payroll Run
          </Button>
        }
      />

      <div className="space-y-4">
        {runs.map((run) => (
          <Card key={run.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-foreground">
                    Payroll Run — {new Date(2026, run.month - 1).toLocaleString("default", { month: "long" })} {run.year}
                  </h3>
                  <Badge variant={run.status === "Paid" ? "success" : run.status === "Approved" ? "warning" : "secondary"}>
                    {run.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Processed on: {run.processedAt} • Total Employees Covered: <span className="font-semibold text-foreground">{run.employeeCount}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total Gross Pay</p>
                  <p className="font-bold text-foreground">₹{run.totalGross?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions & Tax</p>
                  <p className="font-bold text-rose-600">₹{run.totalDeductions?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Payout</p>
                  <p className="font-bold text-emerald-600 text-base">₹{run.totalNet?.toLocaleString("en-IN")}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
                  <FileText className="h-3.5 w-3.5" /> View Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
