export default function CoreSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-500">Tenant-level configuration and system settings.</p>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Settings are managed on the backend. Use Feature Flags and Module Subscriptions to control behavior.
      </div>
    </div>
  );
}
