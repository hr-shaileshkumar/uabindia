"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import VendorsManager from "@/features/erp/components/VendorsManager";
import SchemaCrudPage from "@/features/erp/components/SchemaCrudPage";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";

export default function VendorsPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.VENDOR_VIEW}>
      <SchemaCrudPage
        pageKey="vendors"
        api={hrApi.erp.vendors}
        fallback={<VendorsManager api={hrApi.erp.vendors} />}
        fallbackTitle="Vendors"
        fallbackSubtitle="Manage supplier and vendor records"
      />
    </ProtectedRoute>
  );
}
