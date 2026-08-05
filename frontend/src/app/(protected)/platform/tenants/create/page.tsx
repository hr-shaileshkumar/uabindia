"use client";

import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { TenantCreateForm } from "@/features/tenants/components/forms/TenantCreateForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateTenantPage() {
  const router = useRouter();

  return (
    <StandardPageLayout
      title="Create New Tenant"
      subtitle="Provision a new SaaS tenant with subscription details and admin credentials."
      eyebrow="Platform Operations"
      icon="globe"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Step", value: "1 of 2" },
            { label: "Section", value: "Tenant Details" },
          ]}
        />
      }
      actions={
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tenants
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto p-4 bg-background rounded-lg shadow-sm">
        <TenantCreateForm />
      </div>
    </StandardPageLayout>
  );
}
