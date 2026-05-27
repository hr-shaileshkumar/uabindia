import StandardPageLayout from "@/components/layout/StandardPageLayout";

export default function MfaPage() {
  return (
    <StandardPageLayout
      title="Multi-Factor Authentication"
      subtitle="Planned MFA controls and rollout posture for tenant security."
      eyebrow="Security / Verification"
      icon="shield"
    >
      <div className="erp-alert-info">
        MFA self-service and policy management are not yet connected to backend controls in this environment. This page is now a stable placeholder instead of a 404 so navigation remains consistent while the feature is completed.
      </div>

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Planned MFA capabilities</div>
            <div className="erp-table-subtitle">These controls will become active once MFA enrollment and policy APIs are available.</div>
          </div>
          <span className="erp-toolbar-badge">Roadmap</span>
        </div>
        <ul className="space-y-3 p-4 text-sm text-slate-600">
          <li>• Enforce MFA enrollment by role or module.</li>
          <li>• Review enrolled authenticators and recovery methods.</li>
          <li>• Audit MFA challenge frequency and bypass exceptions.</li>
          <li>• Support staged rollout before organization-wide enforcement.</li>
        </ul>
      </div>
    </StandardPageLayout>
  );
}
