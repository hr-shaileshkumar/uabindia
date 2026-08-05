"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { Users, Mail, Phone, Building2, TrendingUp, Activity } from "lucide-react";

type Customer = {
  id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  creditLimit?: number;
  status?: string;
  createdAt?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

type CellArgs = { getValue: () => any; row?: any };

export default function CRMCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.erp.customers.getAll().catch(() => ({ data: { data: [] } }));
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setCustomers(list);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load customers.");
      setError(msg);
      notifyError(msg, "CRM");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeCustomers = useMemo(() => customers.filter((c) => c.status !== "Inactive").length, [customers]);
  const totalCreditLimit = useMemo(() => customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0), [customers]);
  const recentCustomers = useMemo(() => customers.slice(0, 5), [customers]);

  const columns = [
    {
      accessorKey: "customerCode",
      header: "Code",
      cell: ({ getValue }: CellArgs) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{getValue()}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ getValue, row }: CellArgs) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{getValue()}</span>
          <span className="text-xs text-slate-500">{row.original.email || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ getValue }: CellArgs) => <span className="text-slate-600 dark:text-slate-400">{getValue() || "-"}</span>,
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ getValue }: CellArgs) => <span className="text-slate-600 dark:text-slate-400">{getValue() || "-"}</span>,
    },
    {
      accessorKey: "creditLimit",
      header: "Credit Limit",
      cell: ({ getValue }: CellArgs) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(getValue())}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }: CellArgs) => (
        <StatusBadge tone={getValue() === "Active" ? "positive" : getValue() === "Inactive" ? "danger" : "warning"}>
          {getValue()}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Customer Master"
        subtitle="Customer master data, contact information, credit management, and account hierarchy."
        eyebrow="CRM / Customers"
        icon="users"
        stats={[
          { label: "Total Customers", value: customers.length },
          { label: "Active", value: activeCustomers, tone: "success" },
          { label: "Credit Limit", value: formatCurrency(totalCreditLimit), tone: "info" },
          { label: "Recent Added", value: recentCustomers.length, tone: "warning" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">Export</Button>
            <Link href={ROUTES.CUSTOMERS + "/create"}>
              <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm">
                + Add Customer
              </Button>
            </Link>
          </div>
        }
      />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Customers", value: customers.length.toString(), icon: Users, href: ROUTES.CUSTOMERS },
          { label: "Active", value: activeCustomers.toString(), icon: TrendingUp, href: ROUTES.CUSTOMERS },
          { label: "Credit Limit", value: formatCurrency(totalCreditLimit), icon: Activity, href: ROUTES.CUSTOMERS },
          { label: "Recent Added", value: recentCustomers.length.toString(), icon: Building2, href: ROUTES.CUSTOMERS },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="group cursor-pointer">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-slate-500">Click to view details</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Customers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
            <CardDescription>Latest customers added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-slate-200 animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">No customers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <span className="text-sm font-bold">{customer.customerCode}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{customer.customerName}</p>
                      <p className="text-xs text-slate-500">{customer.email || "-"}</p>
                    </div>
                    <Badge variant={customer.status === "Active" ? "success" : "warning"}>{customer.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Customer profile overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Email Verified</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round((customers.filter((c) => c.email).length / (customers.length || 1)) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">With Credit Limit</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {customers.filter((c) => c.creditLimit).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Primary Contacts</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {customers.filter((c) => c.phoneNumber).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>All registered customers with contact information and credit limits</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            title="Customers"
            description="View and manage all customer records"
            columns={columns}
            data={customers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
