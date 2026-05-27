import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">Access blocked</h1>
        <p className="mt-3 text-sm text-slate-300">
          This page is not available for your current module access, role, or feature flags.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          If you believe this is an error, contact your administrator.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100"
          >
            Re-authenticate
          </Link>
        </div>
      </div>
    </main>
  );
}
