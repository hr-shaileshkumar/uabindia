"use client";

import { useEffect, useMemo, useState } from "react";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { hrApi } from "@/lib/hrApi";

const headingFont = Space_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"] });
const bodyFont = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface AuditRow {
  id: string;
  entityName: string;
  entityId?: string | null;
  action: string;
  performedAt: string;
  performedBy?: string | null;
  ip?: string | null;
}

interface AuditLogResponse {
  logs?: AuditRow[];
  total?: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [page] = useState(1);
  const [total, setTotal] = useState(0);

  const queryParams = useMemo(() => ({
    page,
    limit: 50,
    entity: entity.trim() || undefined,
    action: action.trim() || undefined,
    performedBy: performedBy.trim() || undefined,
  }), [page, entity, action, performedBy]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await hrApi.platform.auditLogs(queryParams);
        const data = (res.data || {}) as AuditLogResponse;
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError((err as Error).message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [queryParams]);

  return (
    <div
      className={`${bodyFont.className} min-h-[70vh] rounded-3xl border border-black/5 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]`}
      style={{
        backgroundImage: "radial-gradient(1200px 500px at 10% -10%, rgba(37,99,235,0.14), transparent 60%), radial-gradient(800px 400px at 95% 0%, rgba(255,209,102,0.22), transparent 55%), linear-gradient(180deg, #f8f5f1 0%, #ffffff 60%)",
        color: "#101318",
      }}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2" style={{ animation: "fadeInUp 0.6s ease-out both" }}>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Platform / Core</p>
          <h1 className={`${headingFont.className} text-3xl md:text-4xl font-semibold`}>Audit Trail</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            System-level change history for compliance and traceability. Filter by entity, action, or user.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
          <input
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            placeholder="Entity (e.g., Companies)"
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Action (e.g., Added)"
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="Performed By (User ID)"
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-600">
            <span>{loading ? "Loading..." : `${total} events`}</span>
            <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">Live</span>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80" style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Entity Id</th>
                  <th className="px-4 py-3 text-left">Performed By</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.entityName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.entityId || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.performedBy || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.ip || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.performedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No audit logs found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
