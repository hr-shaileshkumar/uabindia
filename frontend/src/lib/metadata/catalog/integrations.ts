import { PageSchema } from "../types";

export const integrationsSchemas: Record<string, PageSchema> = {
  "integrations.overview": {
    pageKey: "integrations.overview",
    title: "Integrations & Webhooks Manager",
    subTitle: "Connect payment gateways, communications, webhooks, and secure API keys seamlessly without code modifications.",
    entityName: "IntegrationConnector",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/integrations",
    icon: "Layers",
    requiredPermission: "licensing.integrations.read",
    columns: [
      { key: "name", label: "Connector Name", width: 220 },
      { key: "provider", label: "Provider", width: 180 },
      { key: "category", label: "Category", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 120 },
      { key: "lastTestedAt", label: "Last Tested", type: "datetime", width: 170 },
      { key: "lastSyncAt", label: "Last Sync", type: "datetime", width: 170 },
      { key: "lastError", label: "Last Error", width: 220 },
    ],
    filters: [
      { key: "search", label: "Search connectors", type: "text" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "Payment", label: "Payment Gateway" },
          { value: "Communication", label: "Communication (WhatsApp / Email)" },
          { value: "Tax", label: "Tax & Compliance" },
          { value: "Finance", label: "Banking & Finance" },
          { value: "HR", label: "HR & Biometrics" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "general",
          label: "Connector Details",
          fields: [
            { key: "name", label: "Connector Name", type: "text", required: true, span: 2 },
            { key: "connectorKey", label: "Connector Identifier (e.g. razorpay, phonepe, cashfree)", type: "text", required: true, span: 2 },
            { key: "provider", label: "Provider Service", type: "text", required: true, span: 2 },
            {
              key: "category",
              label: "Category",
              type: "select",
              required: true,
              options: [
                { value: "Payment", label: "Payment Gateway" },
                { value: "Communication", label: "Communication" },
                { value: "Tax", label: "Tax & Compliance" },
                { value: "Finance", label: "Banking & Finance" },
                { value: "HR", label: "HR & Biometrics" },
              ],
              span: 2,
            },
            { key: "apiKey", label: "API Key / Key ID / Client ID", type: "password", span: 2 },
            { key: "secretKey", label: "API Secret / Salt / Private Key", type: "password", span: 2 },
            { key: "webhookUrl", label: "Webhook Callback URL", type: "url", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Connector", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Configure Credentials", variant: "secondary", icon: "Sliders" },
      { key: "test", label: "Test Connection", variant: "ghost", icon: "CheckCircle" },
      { key: "sync", label: "Sync Now", variant: "ghost", icon: "RefreshCw" },
    ],
  },

  "integrations.apps": {
    pageKey: "integrations.apps",
    title: "Integrations & Connectors Hub",
    subTitle: "Connect payment gateways (Razorpay, Stripe, Cashfree, PhonePe), messaging (WhatsApp, SendGrid), GST, and banking without code changes.",
    entityName: "IntegrationConnector",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/integrations",
    icon: "Boxes",
    requiredPermission: "licensing.integrations.read",
    columns: [
      { key: "name", label: "Connector Name", width: 220 },
      { key: "provider", label: "Provider", width: 180 },
      { key: "category", label: "Category", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 120 },
      { key: "lastTestedAt", label: "Last Tested", type: "datetime", width: 170 },
      { key: "lastSyncAt", label: "Last Sync", type: "datetime", width: 170 },
      { key: "lastError", label: "Last Error", width: 220 },
    ],
    filters: [
      { key: "search", label: "Search connectors", type: "text" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "Payment", label: "Payment Gateway" },
          { value: "Communication", label: "Communication (WhatsApp / Email)" },
          { value: "Tax", label: "Tax & Compliance" },
          { value: "Finance", label: "Banking & Finance" },
          { value: "HR", label: "HR & Biometrics" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "general",
          label: "Connector Details",
          fields: [
            { key: "name", label: "Connector Name", type: "text", required: true, span: 2 },
            { key: "connectorKey", label: "Connector Identifier (e.g. razorpay, phonepe, cashfree)", type: "text", required: true, span: 2 },
            { key: "provider", label: "Provider Service", type: "text", required: true, span: 2 },
            {
              key: "category",
              label: "Category",
              type: "select",
              required: true,
              options: [
                { value: "Payment", label: "Payment Gateway" },
                { value: "Communication", label: "Communication" },
                { value: "Tax", label: "Tax & Compliance" },
                { value: "Finance", label: "Banking & Finance" },
                { value: "HR", label: "HR & Biometrics" },
              ],
              span: 2,
            },
            { key: "apiKey", label: "API Key / Key ID / Client ID", type: "password", span: 2 },
            { key: "secretKey", label: "API Secret / Salt / Private Key", type: "password", span: 2 },
            { key: "webhookUrl", label: "Webhook Callback URL", type: "url", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Connector", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Configure Credentials", variant: "secondary", icon: "Sliders" },
      { key: "test", label: "Test Connection", variant: "ghost", icon: "CheckCircle" },
      { key: "sync", label: "Sync Now", variant: "ghost", icon: "RefreshCw" },
    ],
  },

  "integrations.webhooks": {
    pageKey: "integrations.webhooks",
    title: "Webhooks Manager",
    subTitle: "Configure real-time event webhooks to stream ERP transactions to Zapier, Pabbly, or custom endpoints.",
    entityName: "TenantWebhook",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/integrations/webhooks",
    icon: "Webhook",
    requiredPermission: "licensing.integrations.read",
    columns: [
      { key: "name", label: "Webhook Name", width: 200 },
      { key: "targetUrl", label: "Target Destination URL", width: 300 },
      { key: "eventsJson", label: "Subscribed Events", width: 220 },
      { key: "isActive", label: "Active", type: "badge", width: 100 },
      { key: "failureCount", label: "Failures", type: "number", width: 110 },
      { key: "lastTriggeredAt", label: "Last Fired", type: "datetime", width: 170 },
      { key: "createdAt", label: "Created", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search webhooks", type: "text" },
      {
        key: "isActive",
        label: "Status",
        type: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Disabled" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "webhook",
          label: "Webhook Configuration",
          fields: [
            { key: "name", label: "Webhook Name (e.g. Zapier Payment Sync)", type: "text", required: true, span: 2 },
            { key: "targetUrl", label: "Target URL (HTTP POST)", type: "url", required: true, span: 2 },
            { key: "secretKey", label: "HMAC Signing Secret", type: "password", span: 2 },
            { key: "eventsJson", label: "Events Filter (JSON array e.g. [\"payment.received\",\"invoice.created\"])", type: "text", span: 2 },
            { key: "isActive", label: "Enable Webhook", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Webhook", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit Endpoint", variant: "secondary", icon: "Pencil" },
      { key: "test", label: "Send Test Event", variant: "ghost", icon: "Send" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },

  "integrations.api-keys": {
    pageKey: "integrations.api-keys",
    title: "API Keys Management",
    subTitle: "Generate and manage high-security API keys for external software, IoT turnstiles, and automated scripts.",
    entityName: "IntegrationApiKey",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/integrations/api-keys",
    icon: "Key",
    requiredPermission: "licensing.integrations.read",
    columns: [
      { key: "name", label: "Key Description", width: 220 },
      { key: "prefix", label: "Key Prefix", width: 180 },
      { key: "scope", label: "Permission Scope", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 110 },
      { key: "lastUsedAt", label: "Last Used", type: "datetime", width: 170 },
      { key: "createdAt", label: "Created Date", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search API keys", type: "text" },
      {
        key: "scope",
        label: "Scope",
        type: "select",
        options: [
          { value: "read", label: "Read-Only" },
          { value: "write", label: "Read & Write" },
          { value: "admin", label: "Full Admin Access" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "key",
          label: "API Key Details",
          fields: [
            { key: "name", label: "Key Description (e.g. Production Mobile App / Biometric Machine)", type: "text", required: true, span: 2 },
            {
              key: "scope",
              label: "Permission Scope",
              type: "select",
              required: true,
              options: [
                { value: "read", label: "Read-Only" },
                { value: "write", label: "Read & Write" },
                { value: "admin", label: "Full Admin Access" },
              ],
              span: 2,
            },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Generate API Key", variant: "primary", icon: "Key" },
      { key: "revoke", label: "Revoke Key", variant: "danger", icon: "XCircle" },
    ],
  },

  "integrations.logs": {
    pageKey: "integrations.logs",
    title: "Integration & Sync Logs",
    subTitle: "Live stream and audit history of all inbound webhooks and outbound sync operations.",
    entityName: "IntegrationSyncLog",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/integrations/logs",
    icon: "ScrollText",
    requiredPermission: "licensing.integrations.read",
    columns: [
      { key: "connectorKey", label: "Connector", width: 180 },
      { key: "direction", label: "Direction", width: 120 },
      { key: "operation", label: "Operation", width: 160 },
      { key: "status", label: "Status", type: "badge", width: 110 },
      { key: "recordsProcessed", label: "Records", type: "number", width: 100 },
      { key: "message", label: "Summary Message", width: 280 },
      { key: "startedAt", label: "Started At", type: "datetime", width: 170 },
      { key: "completedAt", label: "Completed At", type: "datetime", width: 170 },
    ],
    filters: [
      { key: "search", label: "Search logs", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Success", label: "Success" },
          { value: "Failed", label: "Failed" },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        type: "select",
        options: [
          { value: "Inbound", label: "Inbound (Webhooks)" },
          { value: "Outbound", label: "Outbound (Sync)" },
        ],
      },
    ],
    actions: [
      { key: "refresh", label: "Refresh Logs", variant: "secondary", icon: "RefreshCw" },
    ],
  },
};
