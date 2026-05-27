"use client";

export default function LicensingOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modules & Licensing</h1>
        <p className="text-gray-600 mt-1">Product control - manage what the ERP can do and who can use it</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Licensing Control</h2>
        <p className="text-gray-600">
          Used by product/super admins to turn modules on/off per client without code changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <a
            href="/licensing/catalog"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold text-gray-900">Module Catalog</div>
            <div className="text-sm text-gray-600 mt-1">List of all available modules and versions</div>
          </a>

          <a
            href="/licensing/subscriptions"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">🧾</div>
            <div className="font-semibold text-gray-900">Subscriptions</div>
            <div className="text-sm text-gray-600 mt-1">Enable/disable modules per tenant</div>
          </a>

          <a
            href="/licensing/integrations"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">🔑</div>
            <div className="font-semibold text-gray-900">API Keys & Integrations</div>
            <div className="text-sm text-gray-600 mt-1">Webhooks, third-party sync</div>
          </a>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
        <h3 className="font-semibold text-purple-900">Key Features</h3>
        <ul className="mt-2 space-y-1 text-sm text-purple-800">
          <li>✓ Dynamic module activation per tenant</li>
          <li>✓ Version control and compatibility tracking</li>
          <li>✓ API-driven integration management</li>
          <li>✓ No code changes required to enable/disable features</li>
        </ul>
      </div>
    </div>
  );
}
