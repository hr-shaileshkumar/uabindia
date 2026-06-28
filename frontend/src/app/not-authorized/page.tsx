"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const messages: Record<string, { title: string; body: string; note: string }> = {
  "access-not-configured": {
    title: "Access is not configured",
    body: "Your account is authenticated, but the backend has not published module navigation or route access for this workspace yet.",
    note: "An administrator needs to verify tenant modules, role mapping, menu configuration, and route rules.",
  },
  "permissions-unavailable": {
    title: "Permissions could not be loaded",
    body: "The frontend could not retrieve your backend permission grants for this session.",
    note: "Retry the session or contact support if the permissions API remains unavailable.",
  },
  "navigation-unavailable": {
    title: "Workspace navigation is unavailable",
    body: "The backend navigation contract could not be loaded, so the protected shell cannot render a safe workspace.",
    note: "This is usually caused by a backend API failure or incomplete tenant UI schema setup.",
  },
  "access-denied": {
    title: "Access blocked",
    body: "This page is not available for your current backend permissions, enabled modules, or feature configuration.",
    note: "If you believe this is incorrect, contact your administrator.",
  },
};

export default function NotAuthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "access-denied";
  const message = messages[reason] || messages["access-denied"];

  return (
    <main className="flex min-h-screen items-center justify-center bg-(--erp-canvas) px-6 text-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">{message.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{message.body}</p>
        <p className="mt-2 text-xs text-slate-500">{message.note}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/context"
            className="inline-flex items-center justify-center rounded-md bg-(--erp-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--erp-primary-hover)"
          >
            Re-check workspace
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
