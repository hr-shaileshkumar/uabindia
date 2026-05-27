"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApi } from "@/lib/hrApi";

type DashboardMetrics = {
  totalCustomers: number;
  totalVendors: number;
  totalItems: number;
  totalAccounts: number;
  revenue: number;
  expenses: number;
  receivables: number;
  payables: number;
};

export default function ERPDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalVendors: 0,
    totalItems: 0,
    totalAccounts: 0,
    revenue: 0,
    expenses: 0,
    receivables: 0,
    payables: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [customersRes, vendorsRes, itemsRes, accountsRes] = await Promise.all([
          hrApi.erp.customers.getAll(1, 1),
          hrApi.erp.vendors.getAll(1, 1),
          hrApi.erp.items.getAll(1, 1),
          hrApi.erp.chartOfAccounts.getAll(),
        ]);

        const totalCustomers = customersRes.data?.total ?? customersRes.data?.data?.length ?? 0;
        const totalVendors = vendorsRes.data?.total ?? vendorsRes.data?.data?.length ?? 0;
        const totalItems = itemsRes.data?.total ?? itemsRes.data?.data?.length ?? 0;
        const totalAccounts = Array.isArray(accountsRes.data) ? accountsRes.data.length : 0;

        setMetrics((prev) => ({
          ...prev,
          totalCustomers,
          totalVendors,
          totalItems,
          totalAccounts,
        }));
      } catch {
        setMetrics((prev) => ({ ...prev }));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const dashboardModules = [
    {
      title: "Sales & CRM",
      description: "Manage customers and sales operations",
      items: [
        { name: "Customers", href: "/erp/customers", count: metrics.totalCustomers },
        { name: "Sales Orders", href: "/erp/sales-orders" },
      ],
      icon: "📊",
    },
    {
      title: "Purchase & Procurement",
      description: "Manage vendors and purchase operations",
      items: [
        { name: "Vendors", href: "/erp/vendors", count: metrics.totalVendors },
        { name: "Purchase Orders", href: "/erp/purchase-orders" },
      ],
      icon: "🛒",
    },
    {
      title: "Inventory Management",
      description: "Manage items and stock levels",
      items: [
        { name: "Items", href: "/erp/items", count: metrics.totalItems },
      ],
      icon: "📦",
    },
    {
      title: "Finance & Accounting",
      description: "Manage financial records",
      items: [
        { name: "Chart of Accounts", href: "/erp/chart-of-accounts", count: metrics.totalAccounts },
      ],
      icon: "💰",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ERP Dashboard</h1>
        <p className="text-gray-500 mt-2">Enterprise resource planning overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : metrics.totalCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">Active customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : metrics.totalVendors}</div>
            <p className="text-xs text-gray-500 mt-1">Registered vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : metrics.totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">Products in catalog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">GL Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : metrics.totalAccounts}</div>
            <p className="text-xs text-gray-500 mt-1">Chart of accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary (This Month)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold text-green-600">₹{(metrics.revenue / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">₹{(metrics.expenses / 100000).toFixed(1)}L</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-medium text-gray-700">Profit</span>
              <span className="font-bold text-blue-600">₹{((metrics.revenue - metrics.expenses) / 100000).toFixed(1)}L</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Receivables</span>
              <span className="font-semibold text-orange-600">₹{(metrics.receivables / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payables</span>
              <span className="font-semibold text-purple-600">₹{(metrics.payables / 100000).toFixed(1)}L</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-medium text-gray-700">Net Position</span>
              <span className="font-bold text-gray-800">₹{((metrics.receivables - metrics.payables) / 100000).toFixed(1)}L</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardModules.map((module) => (
          <Card key={module.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{module.icon}</span>
                {module.title}
              </CardTitle>
              <p className="text-sm text-gray-500">{module.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {module.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-700">{item.name}</span>
                    {item.count !== undefined && (
                      <span className="text-sm font-medium text-gray-500">{item.count}</span>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-lg font-semibold mt-1">
              ₹{(metrics.revenue / 50).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Profit Margin</p>
            <p className="text-lg font-semibold mt-1 text-green-600">
              {((((metrics.revenue - metrics.expenses) / metrics.revenue) * 100) || 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Receivables Days</p>
            <p className="text-lg font-semibold mt-1">28 days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payables Days</p>
            <p className="text-lg font-semibold mt-1">35 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
