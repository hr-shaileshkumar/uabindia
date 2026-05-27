"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface ProjectRow {
  id: string;
  name: string;
  companyId: string;
  companyName?: string;
  tenantId?: string;
  isActive: boolean;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.project.getAll();
        setProjects(res.data.projects || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Projects / Cost Centers</h2>
        <p className="text-sm text-gray-500">Manage project codes and cost centers.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${projects.length} projects`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Company</th>
                <th className="px-4 py-2 text-left">Tenant ID</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {p.companyName || p.companyId}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{p.tenantId || "-"}</td>
                  <td className="px-4 py-2">{p.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
              {!loading && projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
