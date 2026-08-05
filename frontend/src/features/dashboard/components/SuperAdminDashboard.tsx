"use client";

import Link from "next/link";
import { Building2, Users, ShieldAlert, Cpu, Activity, ArrowUpRight, Plus, Server, Database } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_SYSTEM_METRICS = [
  { name: "Mon", requests: 12400, errors: 12 },
  { name: "Tue", requests: 15800, errors: 8 },
  { name: "Wed", requests: 18200, errors: 15 },
  { name: "Thu", requests: 16900, errors: 5 },
  { name: "Fri", requests: 21000, errors: 19 },
  { name: "Sat", requests: 8900, errors: 2 },
  { name: "Sun", requests: 7400, errors: 1 },
];

const MOCK_TENANT_DISTRIBUTION = [
  { name: "Enterprise", value: 14, color: "#6366f1" },
  { name: "Professional", value: 38, color: "#10b981" },
  { name: "Starter", value: 65, color: "#f59e0b" },
  { name: "Trial", value: 22, color: "#94a3b8" },
];

export function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Command Center"
        subtitle="SuperAdmin overview — tenant health, system performance & security"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/platform/tenants/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Tenant
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tenants"
          value="139"
          description="+12 this month"
          icon={<Building2 className="h-4 w-4" />}
          trend={{ value: "9.4%", positive: true }}
        />
        <StatCard
          title="Total Users Across Tenants"
          value="14,820"
          description="Active user accounts"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: "14.2%", positive: true }}
        />
        <StatCard
          title="System Uptime"
          value="99.98%"
          description="Last 30 days"
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: "0.01%", positive: true }}
        />
        <StatCard
          title="Pending Provisioning"
          value="3"
          description="Requires approval"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>API Traffic & Requests</CardTitle>
            <CardDescription>Daily HTTP requests handled across all tenant instances</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart data={MOCK_SYSTEM_METRICS} xKey="name" yKey="requests" color="#6366f1" height={260} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants by Plan</CardTitle>
            <CardDescription>Subscription tier breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DonutChart data={MOCK_TENANT_DISTRIBUTION} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/platform/tenants" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Tenant Management</CardTitle>
              <Building2 className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Provision, configure, and monitor tenants</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/platform/roles" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Role & Permissions</CardTitle>
              <Cpu className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Global RBAC policy & permissions matrix</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/platform/audit-logs" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Platform Audit Logs</CardTitle>
              <Server className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Cross-tenant administrative activity audit</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/platform/schema-manager" className="block">
          <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">UI Schema Manager</CardTitle>
              <Database className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Dynamic UI & module schema registry</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
