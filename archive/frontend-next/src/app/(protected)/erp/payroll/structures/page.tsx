"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollStructuresPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.structures.list();
        setStructures(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load structures");
      } finally {
        setLoading(false);
      }
    };
    fetchStructures();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Structures</h1>
        <p className="text-sm text-gray-600 mt-1">Manage salary structures and components</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading structures...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        structures.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No structures found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Name</th><th className="px-6 py-3 text-left font-medium text-gray-700">Status</th><th className="px-6 py-3 text-left font-medium text-gray-700">Created</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {structures.map((structure: any) => (
                  <tr key={structure.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{structure.name || "Structure"}</td>
                    <td className="px-6 py-3 text-gray-600">{structure.status || "Active"}</td>
                    <td className="px-6 py-3 text-gray-600">{structure.createdAt ? new Date(structure.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
