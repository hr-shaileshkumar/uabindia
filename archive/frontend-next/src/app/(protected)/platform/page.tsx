"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

type SystemInfo = {
  version: string;
  tenantCount: number;
  health: string;
};

export default function PlatformOverviewPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const [versionRes, tenantsRes] = await Promise.all([
          hrApi.system.getVersion(),
          hrApi.platform.tenants(),
        ]);

        setSystemInfo({
          version: versionRes.version || "1.0.0",
          tenantCount: tenantsRes.data?.tenants?.length || 0,
          health: "Operational",
        });
      } catch (error) {
        console.error("Failed to fetch system info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  if (loading) return <div className="p-6">Loading platform overview...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform / Core Overview</h1>
        <p className="text-gray-600 mt-1">System-level configuration and monitoring (Admin Only)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">System Version</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{systemInfo?.version}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Tenants</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{systemInfo?.tenantCount}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">System Health</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{systemInfo?.health}</div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900">Platform Components</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Tenants (Companies) - Multi-tenant organization management</li>
          <li>• Projects/Cost Centers - Organizational structure</li>
          <li>• Users - System-wide user management</li>
          <li>• Roles & Policies - RBAC/ABAC configuration</li>
          <li>• Settings - Global and tenant-level configuration</li>
          <li>• Feature Flags - Progressive feature rollout</li>
          <li>• Audit Logs - System-wide audit trail</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900">Company Setup</h4>
          <p className="text-sm text-gray-600 mt-1">Create and manage company master data.</p>
          <a href="/platform/companies" className="inline-flex items-center mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Open Company Master →
          </a>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900">Project Mapping</h4>
          <p className="text-sm text-gray-600 mt-1">Define projects/cost centers for reporting.</p>
          <a href="/platform/projects" className="inline-flex items-center mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Open Projects →
          </a>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900">User & Roles</h4>
          <p className="text-sm text-gray-600 mt-1">Assign users and control permissions.</p>
          <a href="/platform/users" className="inline-flex items-center mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Open Users →
          </a>
        </div>
      </div>
    </div>
  );
}
