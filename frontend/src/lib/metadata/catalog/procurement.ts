import { PageSchema } from "../types";

export const procurementSchemas: Record<string, PageSchema> = {
  "procurement.vendors": {
    pageKey: "procurement.vendors",
    title: "Vendors & Suppliers",
    subTitle: "Approved vendor directory, GSTIN profiles, payment terms, and vendor balances.",
    entityName: "Vendor",
    moduleKey: "procurement",
    viewType: "table",
    apiEndpoint: "/procurement/vendors",
    icon: "Truck",
    requiredPermission: "procurement.vendors.read",
    columns: [
      { key: "name", label: "Vendor Name", width: 240 },
      { key: "code", label: "Code", width: 110 },
      { key: "email", label: "Email Address", width: 220 },
      { key: "phone", label: "Phone", width: 140 },
      { key: "gstin", label: "GSTIN", width: 170 },
      { key: "city", label: "City", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 100 },
    ],
    filters: [{ key: "search", label: "Search vendor", type: "text" }],
    form: {
      sections: [
        {
          key: "profile",
          label: "Vendor Details",
          fields: [
            { key: "name", label: "Vendor Name", type: "text", required: true, span: 2 },
            { key: "code", label: "Vendor Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 1 },
            { key: "gstin", label: "GSTIN", type: "text", span: 1 },
            { key: "email", label: "Email Address", type: "email", required: true, span: 1 },
            { key: "phone", label: "Contact Phone", type: "tel", span: 1 },
            { key: "addressLine1", label: "Registered Address", type: "textarea", span: 2 },
            { key: "paymentTerms", label: "Payment Terms (e.g. Net 30)", type: "text", span: 1 },
            { key: "isActive", label: "Active", type: "boolean", span: 1 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Vendor", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "export", label: "Export Vendors", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalVendors", label: "Total Vendors", icon: "Truck", color: "indigo" },
      { key: "activeVendors", label: "Active Suppliers", icon: "CheckCircle2", color: "green" },
    ],
  },

  "procurement.orders": {
    pageKey: "procurement.orders",
    title: "Purchase Orders (PO)",
    subTitle: "Supplier purchase orders, delivery tracking, line items, and approval states.",
    entityName: "PurchaseOrder",
    moduleKey: "procurement",
    viewType: "table",
    apiEndpoint: "/procurement/orders",
    icon: "ClipboardList",
    requiredPermission: "procurement.orders.read",
    columns: [
      { key: "orderNumber", label: "PO Number", width: 140 },
      { key: "vendorName", label: "Vendor", width: 220 },
      { key: "orderDate", label: "PO Date", type: "date", width: 120 },
      { key: "expectedDeliveryDate", label: "Expected Delivery", type: "date", width: 130 },
      { key: "totalAmount", label: "PO Total", type: "currency", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 110 },
    ],
    filters: [
      { key: "search", label: "Search PO number or vendor", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Draft", label: "Draft" },
          { value: "Submitted", label: "Submitted" },
          { value: "Approved", label: "Approved" },
          { value: "Received", label: "Received" },
          { value: "Cancelled", label: "Cancelled" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "po",
          label: "Purchase Order Header",
          fields: [
            { key: "vendorId", label: "Vendor", type: "lookup", lookupEndpoint: "/procurement/vendors", required: true, span: 2 },
            { key: "orderDate", label: "Order Date", type: "date", required: true, span: 1 },
            { key: "expectedDeliveryDate", label: "Expected Delivery", type: "date", span: 1 },
            { key: "totalAmount", label: "Estimated Amount", type: "currency", required: true, span: 1 },
            { key: "notes", label: "Terms & Instructions", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Create PO", variant: "primary", icon: "Plus" },
      { key: "approve", label: "Approve PO", variant: "success", icon: "CheckCircle2" },
      { key: "export", label: "Download PDF", variant: "secondary", icon: "Download" },
    ],
  },
};
