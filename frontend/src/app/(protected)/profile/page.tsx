"use client";

import Link from "next/link";
import {
  Bell,
  FileText,
  ScrollText,
  Ticket,
  UserCircle2,
  WalletCards,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { normalizeRole } from "@/lib/erp/access";

const quickLinks = [
  { label: "Attendance", href: ROUTES.ATTENDANCE, description: "Review daily punch and attendance history.", icon: ScrollText },
  { label: "Leave", href: ROUTES.LEAVE, description: "Track balances, requests, and approvals.", icon: FileText },
  { label: "Payslips", href: ROUTES.PAYROLL_PAYSLIPS, description: "Download the latest salary statements.", icon: WalletCards },
  { label: "Announcements", href: ROUTES.COMMUNICATION_ANNOUNCEMENTS, description: "Read policy, release, and team notices.", icon: Bell },
  { label: "Support Tickets", href: ROUTES.HELPDESK_TICKETS, description: "Review or raise workspace support issues.", icon: Ticket },
] as const;

const formatRoleLabel = (role: string) =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ProfilePage() {
  const { user } = useAuth();
  const normalizedRole = normalizeRole(user?.role);

  return (
    <StandardPageLayout
      title="My Profile"
      subtitle="A focused self-service profile with the key actions an employee actually needs."
      eyebrow="Employee Self Service"
      icon="employees"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <UserCircle2 className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace identity</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {user?.fullName || user?.email || "Employee"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{user?.email || "No email available"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary role</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{formatRoleLabel(normalizedRole)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account status</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {user?.isActive === false ? "Inactive" : "Active"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{user?.tenantId || "Inherited from login context"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Company</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{user?.companyId || "Scoped by workspace context"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Profile boundary</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This page is intentionally narrow. Employees should get direct access to self-service actions, not admin-grade master data screens or create-employee forms.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Where to go next</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}
