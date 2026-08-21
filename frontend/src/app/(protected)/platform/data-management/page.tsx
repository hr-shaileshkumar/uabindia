"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, Inbox, Recycle, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/erp/crud-workspace";
import {
  erpActionCardClassName,
  erpActionCardTitleClassName,
} from "@/components/erp/erpStyles";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  {
    href: ROUTES.PLATFORM_RECYCLE_BIN,
    label: "Recycle bin",
    desc: "Restore soft-deleted platform records.",
    icon: Recycle,
  },
  {
    href: ROUTES.ADMINISTRATION_DOCUMENTS,
    label: "Documents",
    desc: "Upload and download tenant files.",
    icon: FileText,
  },
  {
    href: ROUTES.PLATFORM_CONTACT_SUBMISSIONS,
    label: "Contact submissions",
    desc: "Inbound public-site requests.",
    icon: Inbox,
  },
  {
    href: ROUTES.CUSTOMERS,
    label: "Customer and vendor masters",
    desc: "Create and export records from live list pages.",
    icon: Users,
  },
] as const;

export default function DataManagementPage() {
  return (
    <StandardPageLayout title="Data management" icon="database">
      <CrudCard>
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">
            Use live registers to create and export records. There is no in-browser full-database dump or fake
            import wizard on this page.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={erpActionCardClassName}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                      <link.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className={erpActionCardTitleClassName}>{link.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CrudCard>
    </StandardPageLayout>
  );
}
