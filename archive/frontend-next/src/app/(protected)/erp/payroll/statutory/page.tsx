"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollStatutoryPage() {
  const [statutory, setStatutory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatutory = async () => {
      try {
        setLoading(true);
        const [pfRes, esiRes, ptRes, tdsRes] = await Promise.all([
          hrApi.payroll.statutory.pf(),
          hrApi.payroll.statutory.esi(),
          hrApi.payroll.statutory.pt(),
          hrApi.payroll.statutory.tds(),
        ]);

        const normalize = (type: string, data: any, totalKey: string) => ({
          id: type,
          type,
          period: data?.month ? new Date(data.month).toLocaleDateString() : "-",
          status: data?.records?.length ? "Generated" : "Pending",
          total: data?.[totalKey] ?? 0,
        });

        setStatutory([
          normalize("PF", pfRes.data, "totalPF"),
          normalize("ESI", esiRes.data, "totalESI"),
          normalize("PT", ptRes.data, "totalPT"),
          normalize("TDS", tdsRes.data, "totalTDS"),
        ]);
      } catch (err: any) {
        setError(err.message || "Failed to load statutory records");
      } finally {
        setLoading(false);
      }
    };
    fetchStatutory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statutory Compliance</h1>
        <p className="text-sm text-gray-600 mt-1">PF, ESI, PT and other statutory filings</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading statutory records...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        statutory.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No statutory records found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Type</th><th className="px-6 py-3 text-left font-medium text-gray-700">Period</th><th className="px-6 py-3 text-left font-medium text-gray-700">Total</th><th className="px-6 py-3 text-left font-medium text-gray-700">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {statutory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{item.type || "Compliance"}</td>
                    <td className="px-6 py-3 text-gray-600">{item.period || "-"}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">{item.total ?? 0}</td>
                    <td className="px-6 py-3 text-gray-600">{item.status || "Pending"}</td>
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
