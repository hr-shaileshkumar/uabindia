"use client";

import { useState } from "react";
import { FileText, Download, Search, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Payslip } from "@/types";

const INITIAL_PAYSLIPS: Payslip[] = [
  { id: "1", employeeId: "101", employeeName: "Rahul Verma", month: 7, year: 2026, grossPay: 85000, totalDeductions: 9500, netPay: 75500, status: "Sent" },
  { id: "2", employeeId: "102", employeeName: "Ananya Roy", month: 7, year: 2026, grossPay: 92000, totalDeductions: 11000, netPay: 81000, status: "Sent" },
  { id: "3", employeeId: "103", employeeName: "Vikram Singh", month: 7, year: 2026, grossPay: 65000, totalDeductions: 7200, netPay: 57800, status: "Generated" },
  { id: "4", employeeId: "104", employeeName: "Pooja Patel", month: 7, year: 2026, grossPay: 78000, totalDeductions: 8900, netPay: 69100, status: "Sent" },
];

export function PayslipList() {
  const [slips] = useState<Payslip[]>(INITIAL_PAYSLIPS);
  const [search, setSearch] = useState("");

  const filtered = slips.filter((s) => (s.employeeName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Payslips"
        subtitle="Search, inspect, and download monthly salary slips for all employees"
        breadcrumbs={[
          { label: "Payroll", href: "/payroll" },
          { label: "Payslips" },
        ]}
      />

      <FilterBar searchPlaceholder="Search by employee name..." searchValue={search} onSearchChange={setSearch} />

      <div className="space-y-3">
        {filtered.map((slip) => (
          <Card key={slip.id} className="hover:border-border transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-sm">{slip.employeeName}</span>
                  <Badge variant={slip.status === "Sent" ? "success" : "outline"}>{slip.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Period: July 2026 • Gross: ₹{slip.grossPay.toLocaleString("en-IN")} • Deductions: ₹{slip.totalDeductions.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Net Payable</p>
                  <p className="font-bold text-emerald-600 text-sm">₹{slip.netPay.toLocaleString("en-IN")}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                  <Download className="h-3.5 w-3.5 text-indigo-500" /> PDF Slip
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
