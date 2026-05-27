export default function GlobalLoading() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
