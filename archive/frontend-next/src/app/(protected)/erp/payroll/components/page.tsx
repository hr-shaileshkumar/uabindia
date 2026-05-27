"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollComponentsPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.components.list();
        setComponents(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load components");
      } finally {
        setLoading(false);
      }
    };
    fetchComponents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Components</h1>
        <p className="text-sm text-gray-600 mt-1">Allowances, deductions, and benefits</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading components...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        components.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No components found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Name</th><th className="px-6 py-3 text-left font-medium text-gray-700">Type</th><th className="px-6 py-3 text-left font-medium text-gray-700">Taxable</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {components.map((component: any) => (
                  <tr key={component.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{component.name || "Component"}</td>
                    <td className="px-6 py-3 text-gray-600">{component.type || "Earning"}</td>
                    <td className="px-6 py-3 text-gray-600">{component.isStatutory ? "Yes" : "No"}</td>
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
