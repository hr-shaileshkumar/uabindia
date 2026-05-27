"use client";

export default function SecurityOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authentication & Security</h1>
        <p className="text-gray-600 mt-1">Identity layer - isolated for long-term growth and enterprise identity providers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="/security/sessions"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">♻️</div>
          <div className="font-semibold text-gray-900">Refresh Tokens</div>
          <div className="text-sm text-gray-600 mt-2">Active session management</div>
        </a>

        <a
          href="/security/devices"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">📱</div>
          <div className="font-semibold text-gray-900">Device Sessions</div>
          <div className="text-sm text-gray-600 mt-2">Trusted device tracking</div>
        </a>

        <a
          href="/security/password-policies"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <div className="text-3xl mb-3">🔏</div>
          <div className="font-semibold text-gray-900">Password Policies</div>
          <div className="text-sm text-gray-600 mt-2">Access control configuration</div>
        </a>
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <h3 className="font-semibold text-green-900">Future Enterprise Features</h3>
        <ul className="mt-2 space-y-1 text-sm text-green-800">
          <li>🔜 SSO/OAuth Integration (Google, Microsoft, Okta)</li>
          <li>🔜 SAML 2.0 Support</li>
          <li>🔜 Audit & Compliance Reporting</li>
        </ul>
      </div>
    </div>
  );
}
