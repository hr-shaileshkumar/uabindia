export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tenant Error</p>
        <h1 className="mt-3 text-3xl font-semibold">Tenant not found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The subdomain you entered does not match any configured tenant. Please check the URL or contact your system administrator.
        </p>
      </div>
    </div>
  );
}
