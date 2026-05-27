import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-(--erp-canvas) px-6 text-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">Access blocked</h1>
        <p className="mt-3 text-sm text-slate-600">
          This page is not available for your current module access, role, or feature flags.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          If you believe this is an error, contact your administrator.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-(--erp-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--erp-primary-hover)"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Re-authenticate
          </Link>
        </div>
      </div>
    </main>
  );
}
