"use client";

import Link from "next/link";
import { Clock, Calendar, FileText, CheckCircle, AlertCircle, ArrowRight, UserCheck, Plane, Wallet } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Self Service"
        subtitle="My workspace — attendance, leave balance, payslips & quick requests"
      />

      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Today"
          value="09:02 AM"
          description="Checked in via Web Portal"
          icon={<Clock className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          title="Leave Balance"
          value="18 Days"
          description="12 Casual, 6 Privilege"
          icon={<Calendar className="h-4 w-4 text-indigo-500" />}
        />
        <StatCard
          title="Pending Requests"
          value="2"
          description="1 Leave, 1 Expense"
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          title="Latest Payslip"
          value="July 2026"
          description="Ready to download"
          icon={<FileText className="h-4 w-4 text-blue-500" />}
        />
      </div>

      {/* Quick Action Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/hrms/attendance" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Clock In / Clock Out</CardTitle>
              <UserCheck className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Log attendance & view shift details</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hrms/leave" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Apply for Leave</CardTitle>
              <Plane className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Request leave & view calendar balance</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Submit Expense</CardTitle>
              <Wallet className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Reimbursement reports & receipt upload</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payroll" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">My Payslips</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Download salary slips & tax sheets</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity & Announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Status of your recent applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Casual Leave (2 days)</p>
                <p className="text-xs text-muted-foreground">Aug 12, 2026 - Aug 13, 2026</p>
              </div>
              <Badge variant="warning">Pending Approval</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Privilege Leave (1 day)</p>
                <p className="text-xs text-muted-foreground">Jul 24, 2026</p>
              </div>
              <Badge variant="success">Approved</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Announcements</CardTitle>
            <CardDescription>Latest news from HR & Organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Independence Day Holiday Notice</p>
              <p className="text-xs text-muted-foreground">Office will remain closed on Aug 15th for national holiday.</p>
            </div>
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-sm font-medium text-foreground">Q3 Health & Wellness Drive</p>
              <p className="text-xs text-muted-foreground">Annual health checkup camp scheduled for next week.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
