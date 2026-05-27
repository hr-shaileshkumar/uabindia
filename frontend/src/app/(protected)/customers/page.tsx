"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CustomersManager from "@/features/erp/components/CustomersManager";
import SchemaCrudPage from "@/features/erp/components/SchemaCrudPage";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";

export default function CustomersPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.CUSTOMER_VIEW}>
      <SchemaCrudPage
        pageKey="customers"
        api={hrApi.erp.customers}
        fallback={<CustomersManager api={hrApi.erp.customers} />}
        fallbackTitle="Customers"
        fallbackSubtitle="Manage customer master and billing terms"
      />
    </ProtectedRoute>
  );
}
