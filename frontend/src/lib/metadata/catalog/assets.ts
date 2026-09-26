import { PageSchema } from "../types";

export const assetSchemas: Record<string, PageSchema> = {
  "assets.list": {
    pageKey: "assets.list",
    title: "Fixed Asset Register",
    subTitle: "Capital equipment, machinery, IT assets, serial numbers, and depreciation logs.",
    entityName: "Asset",
    moduleKey: "assets",
    viewType: "table",
    apiEndpoint: "/assets",
    icon: "Shield",
    requiredPermission: "assets.read",
    columns: [
      { key: "assetTag", label: "Asset Tag", width: 130 },
      { key: "name", label: "Asset Name", width: 220 },
      { key: "category", label: "Category", width: 140 },
      { key: "serialNumber", label: "Serial Number", width: 160 },
      { key: "purchaseCost", label: "Cost (INR)", type: "currency", width: 130 },
      { key: "purchaseDate", label: "Purchase Date", type: "date", width: 120 },
      { key: "status", label: "Status", type: "badge", width: 110 },
    ],
    filters: [{ key: "search", label: "Search asset tag or name", type: "text" }],
    form: {
      sections: [
        {
          key: "asset",
          label: "Asset Specifications",
          fields: [
            { key: "assetTag", label: "Asset Tag / QR Code", type: "text", required: true, span: 1 },
            { key: "name", label: "Asset Description", type: "text", required: true, span: 1 },
            { key: "category", label: "Category", type: "text", required: true, span: 1 },
            { key: "serialNumber", label: "Serial Number", type: "text", span: 1 },
            { key: "purchaseCost", label: "Purchase Cost", type: "currency", required: true, span: 1 },
            { key: "purchaseDate", label: "Purchase Date", type: "date", span: 1 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Register Asset", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "export", label: "Export Register", variant: "ghost", icon: "Download" },
    ],
  },
};

export const workflowSchemas: Record<string, PageSchema> = {
  "workflow.approvals": {
    pageKey: "workflow.approvals",
    title: "Approvals Inbox",
    subTitle: "Pending requests awaiting your review across Leave, Claims, Invoices, and Purchase Orders.",
    entityName: "ApprovalRequest",
    moduleKey: "workflow",
    viewType: "table",
    apiEndpoint: "/approvals",
    icon: "CheckSquare",
    requiredPermission: "approvals.read",
    columns: [
      { key: "referenceNumber", label: "Reference #", width: 140 },
      { key: "requestType", label: "Request Type", type: "badge", width: 160 },
      { key: "requestedByName", label: "Requester", width: 180 },
      { key: "description", label: "Summary", width: 280 },
      { key: "requestedAt", label: "Submitted", type: "datetime", width: 160 },
      { key: "status", label: "Status", type: "badge", width: 110 },
    ],
    filters: [
      {
        key: "requestType",
        label: "Module Type",
        type: "select",
        options: [
          { value: "LeaveRequest", label: "Leave Application" },
          { value: "ExpenseClaim", label: "Expense Claim" },
          { value: "PurchaseOrder", label: "Purchase Order" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Approved", label: "Approved" },
          { value: "Rejected", label: "Rejected" },
        ],
      },
    ],
    actions: [
      { key: "approve", label: "Approve Request", variant: "success", icon: "CheckCircle2" },
      { key: "reject", label: "Reject Request", variant: "danger", icon: "XCircle" },
    ],
    kpis: [
      { key: "pendingApprovals", label: "Pending Action", icon: "Clock", color: "amber" },
      { key: "approvedCount", label: "Approved Today", icon: "CheckCircle2", color: "green" },
    ],
  },
};

export const securitySchemas: Record<string, PageSchema> = {
  "security.sessions": {
    pageKey: "security.sessions",
    title: "Security & Active Sessions",
    subTitle: "Live JWT authentication sessions, IP addresses, device agents, and instant revocation controls.",
    entityName: "SecuritySession",
    moduleKey: "security",
    viewType: "table",
    apiEndpoint: "/security/sessions",
    icon: "ShieldAlert",
    requiredPermission: "security.sessions.read",
    columns: [
      { key: "userName", label: "User", width: 180 },
      { key: "ipAddress", label: "IP Address", width: 140 },
      { key: "userAgent", label: "Device / Browser", width: 240 },
      { key: "loginAt", label: "Login Time", type: "datetime", width: 160 },
      { key: "lastActivityAt", label: "Last Active", type: "datetime", width: 160 },
      { key: "isRevoked", label: "Status", type: "badge", width: 110 },
    ],
    filters: [{ key: "search", label: "Search user or IP", type: "text" }],
    actions: [
      { key: "revoke", label: "Revoke Session", variant: "danger", icon: "XCircle" },
    ],
  },
};
