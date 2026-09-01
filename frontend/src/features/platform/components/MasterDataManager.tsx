"use client";

import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpEmptyState } from "@/components/workspace/page-kit";
import { erpButtonClassName } from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";

/**
 * Country/region master API is not exposed yet. Point admins to live org masters instead of a fake empty grid.
 */
export function MasterDataManager() {
  return (
    <StandardPageLayout title="Master data" icon="database" eyebrow="Platform">
      <CrudCard>
        <ErpEmptyState
          message="Country/region catalog API is not available yet. Use live org masters (companies, departments, branches) for production data."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href={ROUTES.PLATFORM_COMPANIES} className={erpButtonClassName.primary}>
                Companies
              </Link>
              <Link href={ROUTES.PLATFORM_DEPARTMENTS} className={erpButtonClassName.secondary}>
                Departments
              </Link>
              <Link href={ROUTES.PLATFORM_BRANCHES} className={erpButtonClassName.secondary}>
                Branches
              </Link>
            </div>
          }
        />
      </CrudCard>
    </StandardPageLayout>
  );
}
