export function AuditLogPanel({
  items,
}: {
  items: Array<{ actor: string; action: string; meta: string; time: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Audit log</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${item.actor}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{item.actor}</p>
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.time}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{item.action}</p>
            <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
