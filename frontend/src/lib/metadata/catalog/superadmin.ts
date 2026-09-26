import { PageSchema } from "../types";

export const superadminSchemas: Record<string, PageSchema> = {
  "superadmin.dashboard": {
    pageKey: "superadmin.dashboard",
    title: "Tenant Management",
    subTitle: "Manage multi-tenant instances, subscriptions, and quotas.",
    entityName: "Tenant",
    moduleKey: "superadmin",
    viewType: "table",
    apiEndpoint: "/administration/tenants",
    icon: "Shield",
    requiredPermission: "superadmin.*",
    columns: [
      { key: "name", label: "Tenant Name", width: 220 },
      { key: "subdomain", label: "Subdomain", width: 160 },
      { key: "subscriptionPlan", label: "Plan", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 110 },
      { key: "employeeLimit", label: "User Limit", type: "number", width: 110 },
      { key: "storageLimitGb", label: "Storage (GB)", type: "number", width: 110 },
      { key: "createdAt", label: "Created", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search Tenants", type: "text", placeholder: "Name or subdomain..." },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "trial", label: "Trial" },
          { value: "suspended", label: "Suspended" },
        ],
      },
      {
        key: "subscriptionPlan",
        label: "Plan",
        type: "select",
        options: [
          { value: "starter", label: "Starter" },
          { value: "professional", label: "Professional" },
          { value: "enterprise", label: "Enterprise" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "identity",
          label: "Tenant Identity",
          fields: [
            { key: "name", label: "Tenant Name", type: "text", required: true, span: 2 },
            { key: "subdomain", label: "Subdomain (e.g. acme)", type: "text", required: true, span: 2 },
            { key: "adminEmail", label: "Admin Email", type: "email", required: true, span: 2 },
            { key: "adminName", label: "Admin Full Name", type: "text", required: true, span: 2 },
          ],
        },
        {
          key: "subscription",
          label: "Subscription & Limits",
          fields: [
            {
              key: "subscriptionPlan",
              label: "Plan",
              type: "select",
              required: true,
              options: [
                { value: "starter", label: "Starter" },
                { value: "professional", label: "Professional" },
                { value: "enterprise", label: "Enterprise" },
              ],
              span: 2,
            },
            { key: "employeeLimit", label: "Max Users", type: "number", span: 1 },
            { key: "storageLimitGb", label: "Storage Limit (GB)", type: "number", span: 1 },
            { key: "isActive", label: "Active Status", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Provision Tenant", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Suspend/Delete", variant: "danger", icon: "Trash2" },
      { key: "export", label: "Export", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalTenants", label: "Total Tenants", icon: "Building2", color: "indigo" },
      { key: "activeTenants", label: "Active", icon: "CheckCircle2", color: "green" },
      { key: "trialTenants", label: "Trial", icon: "Clock", color: "amber" },
      { key: "storageGb", label: "Total Storage (GB)", icon: "HardDrive", color: "blue" },
    ],
  },
  "administration.tenants": {
    pageKey: "administration.tenants",
    title: "Tenant Master",
    subTitle: "Enterprise multi-tenant instances, subscription tiers, isolation boundaries, and quotas.",
    entityName: "Tenant",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/administration/tenants",
    icon: "Building2",
    requiredPermission: "superadmin.*",
    columns: [
      { key: "name", label: "Tenant Name", width: 220 },
      { key: "subdomain", label: "Subdomain", width: 160 },
      { key: "subscriptionPlan", label: "Plan", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 110 },
      { key: "employeeLimit", label: "User Limit", type: "number", width: 110 },
      { key: "storageLimitGb", label: "Storage (GB)", type: "number", width: 110 },
      { key: "createdAt", label: "Created", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search Tenants", type: "text", placeholder: "Name or subdomain..." },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "trial", label: "Trial" },
          { value: "suspended", label: "Suspended" },
        ],
      },
      {
        key: "subscriptionPlan",
        label: "Plan",
        type: "select",
        options: [
          { value: "starter", label: "Starter" },
          { value: "professional", label: "Professional" },
          { value: "enterprise", label: "Enterprise" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "identity",
          label: "Tenant Identity",
          fields: [
            { key: "name", label: "Tenant Name", type: "text", required: true, span: 2 },
            { key: "subdomain", label: "Subdomain (e.g. acme)", type: "text", required: true, span: 2 },
            { key: "adminEmail", label: "Admin Email", type: "email", required: true, span: 2 },
            { key: "adminName", label: "Admin Full Name", type: "text", required: true, span: 2 },
          ],
        },
        {
          key: "subscription",
          label: "Subscription & Limits",
          fields: [
            {
              key: "subscriptionPlan",
              label: "Plan",
              type: "select",
              required: true,
              options: [
                { value: "starter", label: "Starter" },
                { value: "professional", label: "Professional" },
                { value: "enterprise", label: "Enterprise" },
              ],
              span: 2,
            },
            { key: "employeeLimit", label: "Max Users", type: "number", span: 1 },
            { key: "storageLimitGb", label: "Storage Limit (GB)", type: "number", span: 1 },
            { key: "isActive", label: "Active Status", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Provision Tenant", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Suspend/Delete", variant: "danger", icon: "Trash2" },
      { key: "export", label: "Export", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalTenants", label: "Total Tenants", icon: "Building2", color: "indigo" },
      { key: "activeTenants", label: "Active", icon: "CheckCircle2", color: "green" },
      { key: "trialTenants", label: "Trial", icon: "Clock", color: "amber" },
      { key: "storageGb", label: "Total Storage (GB)", icon: "HardDrive", color: "blue" },
    ],
  },
};
