import StandardPageLayout from "@/components/layout/StandardPageLayout";

export default function CoreSettingsPage() {
  return (
    <StandardPageLayout title="Settings" subtitle="Tenant-level configuration and system settings guidance.">

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Settings are managed on the backend. Use Feature Flags and Module Subscriptions to control behavior.
      </div>
    </StandardPageLayout>
  );
}
