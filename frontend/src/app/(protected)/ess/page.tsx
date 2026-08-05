"use client";

import React, { useState } from "react";
import { User, Clock, Calendar, FileText, Plane, Wallet, HelpCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

export default function EmployeeSelfServicePage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);

  const handleToggleClock = () => {
    if (!clockedIn) {
      setClockedIn(true);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setClockTime(now);
      notifySuccess(`Clocked IN successfully at ${now}.`);
    } else {
      setClockedIn(false);
      notifySuccess(`Clocked OUT successfully.`);
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Today's Attendance", value: clockedIn ? "Present" : "Not Clocked", tone: clockedIn ? "positive" : "warning", icon: <Clock className="h-3.5 w-3.5" />, subtext: clockTime ? `In at ${clockTime}` : "Shift 09:00 AM" },
    { label: "Leave Balance", value: "18 Days", tone: "info", icon: <Calendar className="h-3.5 w-3.5" />, subtext: "12 CL / 6 SL" },
    { label: "Latest Payslip", value: "July 2026", tone: "positive", icon: <FileText className="h-3.5 w-3.5" />, subtext: "₹1,25,000 Net" },
    { label: "Pending Claims", value: "₹4,200", tone: "warning", icon: <Wallet className="h-3.5 w-3.5" />, subtext: "Travel Expense" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Employee Self-Service Portal (ESS)"
      subtitle="Personal workspace for attendance punch, leave applications, payslip downloads, expense claims, and helpdesk support."
      categoryTag="Layer 3: Employee Self-Service"
      kpiMetrics={kpis}
      primaryActionLabel={clockedIn ? "Clock OUT" : "Clock IN"}
      onPrimaryAction={handleToggleClock}
      primaryActionIcon={<Clock className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-6 grid gap-6 md:grid-cols-3">
        {/* ESS Shortcuts */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <Badge variant="outline">18 Days Available</Badge>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Apply for Leave</h3>
          <p className="text-xs text-slate-500">Submit casual, sick, or privilege leave requests directly to your reporting manager.</p>
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => notifySuccess("Leave application modal opened.")}>
            Apply Leave <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <FileText className="h-5 w-5 text-emerald-500" />
            <Badge variant="outline">July 2026 Ready</Badge>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Download Payslips & Form 16</h3>
          <p className="text-xs text-slate-500">Access password-protected PDF payslips, tax computation sheets, and Form 16 certificates.</p>
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => notifySuccess("Payslip PDF download started.")}>
            Download Payslip <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Plane className="h-5 w-5 text-sky-500" />
            <Badge variant="outline">Travel & Reimbursement</Badge>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Tour Plan & Expense Claim</h3>
          <p className="text-xs text-slate-500">Submit client visit travel requests, hotel vouchers, and mileage reimbursement claims.</p>
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => notifySuccess("Expense claim form opened.")}>
            File Expense Claim <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
