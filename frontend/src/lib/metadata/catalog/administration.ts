import { PageSchema } from "../types";

export const administrationSchemas: Record<string, PageSchema> = {
  "administration.users": {
    pageKey: "administration.users",
    title: "User Management",
    subTitle: "Manage enterprise user accounts, security roles, and access status.",
    entityName: "User",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/administration/users",
    icon: "Users",
    requiredPermission: "administration.users.read",
    columns: [
      { key: "fullName", label: "Full Name", width: 220 },
      { key: "email", label: "Email Address", width: 240 },
      { key: "role", label: "Primary Role", width: 160 },
      { key: "isActive", label: "Status", type: "badge", width: 100 },
      { key: "lastLoginAt", label: "Last Login", type: "datetime", width: 170 },
      { key: "createdAt", label: "Created", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search name or email", type: "text" },
      {
        key: "isActive",
        label: "Status",
        type: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "profile",
          label: "User Profile",
          fields: [
            { key: "fullName", label: "Full Name", type: "text", required: true, span: 2 },
            { key: "email", label: "Email Address", type: "email", required: true, span: 2 },
            { key: "phone", label: "Phone Number", type: "tel", span: 2 },
            {
              key: "roleId",
              label: "Role",
              type: "select",
              required: true,
              options: [
                { value: "admin", label: "Administrator" },
                { value: "manager", label: "Manager" },
                { value: "employee", label: "Employee" },
              ],
              span: 2,
            },
            { key: "isActive", label: "Active Account", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add User", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Deactivate", variant: "danger", icon: "Trash2" },
      { key: "export", label: "Export", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalUsers", label: "Total Users", icon: "Users", color: "indigo" },
      { key: "activeUsers", label: "Active Users", icon: "CheckCircle2", color: "green" },
      { key: "adminUsers", label: "System Admins", icon: "Shield", color: "purple" },
    ],
  },

  "administration.roles": {
    pageKey: "administration.roles",
    title: "Roles & Permissions",
    subTitle: "Configure role-based access control (RBAC) definitions and capability grants.",
    entityName: "Role",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/administration/roles",
    icon: "Shield",
    requiredPermission: "administration.roles.read",
    columns: [
      { key: "name", label: "Role Name", width: 220 },
      { key: "description", label: "Description", width: 320 },
      { key: "userCount", label: "Assigned Users", type: "number", width: 140 },
      { key: "permissionCount", label: "Capabilities", type: "number", width: 130 },
      { key: "isSystem", label: "Type", type: "badge", width: 110 },
    ],
    filters: [{ key: "search", label: "Search role", type: "text" }],
    form: {
      sections: [
        {
          key: "details",
          label: "Role Details",
          fields: [
            { key: "name", label: "Role Name", type: "text", required: true, span: 2 },
            { key: "description", label: "Description", type: "textarea", span: 2 },
            { key: "isActive", label: "Active", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Role", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Configure Permissions", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },

  "administration.departments": {
    pageKey: "administration.departments",
    title: "Departments",
    subTitle: "Organizational structure, cost assignment, and departmental reporting hierarchy.",
    entityName: "Department",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/hrms/departments",
    icon: "Layers",
    requiredPermission: "administration.departments.read",
    columns: [
      { key: "name", label: "Department Name", width: 220 },
      { key: "code", label: "Code", width: 120 },
      { key: "parentDepartmentName", label: "Parent Dept", width: 200 },
      { key: "managerName", label: "Department Head", width: 180 },
      { key: "employeeCount", label: "Headcount", type: "number", width: 110 },
      { key: "isActive", label: "Status", type: "badge", width: 100 },
    ],
    filters: [{ key: "search", label: "Search department", type: "text" }],
    form: {
      sections: [
        {
          key: "basic",
          label: "Department Info",
          fields: [
            { key: "name", label: "Department Name", type: "text", required: true, span: 2 },
            { key: "code", label: "Department Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 2 },
            { key: "parentDepartmentId", label: "Parent Department", type: "lookup", lookupEndpoint: "/hrms/departments", span: 2 },
            { key: "managerId", label: "Head / Manager", type: "lookup", lookupEndpoint: "/hrms/employees", span: 2 },
            { key: "isActive", label: "Active", type: "boolean", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Department", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },

  "administration.companies": {
    pageKey: "administration.companies",
    title: "Companies & Legal Entities",
    subTitle: "Corporate entity registration, financial calendar, and GSTIN/PAN setup.",
    entityName: "Company",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/administration/companies",
    icon: "Building2",
    requiredPermission: "administration.companies.read",
    columns: [
      { key: "name", label: "Company Name", width: 220 },
      { key: "legalName", label: "Legal Entity Name", width: 260 },
      { key: "code", label: "Code", width: 110 },
      { key: "gstin", label: "GSTIN", width: 170 },
      { key: "city", label: "City", width: 130 },
      { key: "state", label: "State", width: 130 },
      { key: "isActive", label: "Status", type: "badge", width: 100 },
    ],
    filters: [{ key: "search", label: "Search company", type: "text" }],
    form: {
      sections: [
        {
          key: "identity",
          label: "Corporate Identity & Letterhead Branding",
          description: "Entity legal names and branding assets used across official invoices and letterheads.",
          fields: [
            { key: "name", label: "Trade / Display Name", type: "text", required: true, span: 1, placeholder: "e.g. UAB India Tech" },
            { key: "legalName", label: "Full Legal Entity Name (for Letterhead)", type: "text", required: true, span: 1, placeholder: "e.g. UAB India Enterprises Private Limited" },
            { key: "code", label: "Company Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 1 },
            { key: "logoUrl", label: "Logo URL (for Letterhead Header)", type: "text", span: 1, placeholder: "https://... or /assets/logo.png" },
            { key: "brandColor", label: "Primary Brand Color (Hex)", type: "text", span: 1, placeholder: "#0f172a (Navy / Dark Slate)" },
            { key: "accentColor", label: "Accent / Secondary Color (Hex)", type: "text", span: 1, placeholder: "#2563eb (Royal Blue / Gold)" },
            { 
              key: "letterheadLayout", 
              label: "Letterhead Layout Style", 
              type: "select", 
              span: 1,
              options: [
                { label: "Modern Split (Left Logo / Right Address)", value: "modern-split" },
                { label: "Centered Banner (Top Logo & Ribbon)", value: "centered-banner" },
                { label: "Classic Left (Traditional Letterhead)", value: "classic-left" },
                { label: "Minimal Ribbon (Eco & Compact)", value: "minimal-ribbon" }
              ]
            },
            { key: "signatoryName", label: "Authorized Signatory Name", type: "text", span: 1, placeholder: "e.g. Rajesh Sharma" },
            { key: "signatoryDesignation", label: "Signatory Title / Designation", type: "text", span: 1, placeholder: "e.g. Managing Director / Head HR" },
            { key: "stampUrl", label: "Official Seal / Digital Stamp URL", type: "text", span: 1, placeholder: "https://... or /assets/stamp.png" },
            { key: "industry", label: "Industry Sector", type: "text", span: 1, placeholder: "Technology / Manufacturing / Retail" },
            { key: "isActive", label: "Active Status", type: "boolean", span: 1 },
          ],
        },
        {
          key: "statutory",
          label: "Tax & Statutory Registrations",
          description: "GSTIN, PAN, and corporate identity numbers printed on tax documents.",
          fields: [
            { key: "gstin", label: "GSTIN / Universal Tax ID", type: "text", span: 1, placeholder: "15-character GSTIN (e.g. 29ABCDE1234F1Z5)" },
            { key: "pan", label: "PAN", type: "text", span: 1, placeholder: "10-character PAN" },
            { key: "cin", label: "CIN / Registration Number", type: "text", span: 1, placeholder: "Corporate Identification Number" },
            { key: "tan", label: "TAN", type: "text", span: 1, placeholder: "Tax Deduction Account Number" },
            { key: "financialYearStart", label: "FY Start Date", type: "date", span: 1 },
            { key: "financialYearEnd", label: "FY End Date", type: "date", span: 1 },
          ],
        },
        {
          key: "address",
          label: "Registered Office & Letterhead Address",
          description: "Physical location printed on corporate stationery, invoices, and payslips.",
          fields: [
            { key: "registrationAddress", label: "Registered Office Address", type: "textarea", required: true, span: 2, placeholder: "Plot/Building No, Street, Landmark..." },
            { key: "operationalAddress", label: "Operational / Factory Address", type: "textarea", span: 2, placeholder: "Branch/Plant/Works Address..." },
            { key: "city", label: "City", type: "text", required: true, span: 1, placeholder: "Bengaluru / Mumbai" },
            { key: "state", label: "State", type: "text", required: true, span: 1, placeholder: "Karnataka / Maharashtra" },
            { key: "postalCode", label: "PIN / Postal Code", type: "text", required: true, span: 1, placeholder: "560100" },
            { key: "country", label: "Country", type: "text", span: 1, placeholder: "India" },
          ],
        },
        {
          key: "contact",
          label: "Corporate Communication",
          description: "Official contacts included in corporate document headers and footers.",
          fields: [
            { key: "email", label: "Official Contact Email", type: "text", span: 1, placeholder: "contact@company.com" },
            { key: "phoneNumber", label: "Phone / Board Line", type: "text", span: 1, placeholder: "+91 80 1234 5678" },
            { key: "websiteUrl", label: "Official Website", type: "text", span: 2, placeholder: "https://www.company.com" },
          ],
        },
        {
          key: "banking",
          label: "Bank Remittance Details (for Invoices & Receipts)",
          description: "Official bank details printed on invoices, POs, and payslips for wire transfers.",
          fields: [
            { key: "bankName", label: "Bank Name", type: "text", span: 1, placeholder: "e.g. HDFC Bank Ltd" },
            { key: "bankAccountNumber", label: "Bank Account Number", type: "text", span: 1, placeholder: "Account Number" },
            { key: "bankBranch", label: "Branch Name", type: "text", span: 1, placeholder: "Branch Location" },
            { key: "ifscCode", label: "IFSC / Routing Code", type: "text", span: 1, placeholder: "e.g. HDFC0001234" },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Company", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },

  "administration.branches": {
    pageKey: "administration.branches",
    title: "Operating Branches",
    subTitle: "Physical office locations, warehouses, factories, and GST registration units.",
    entityName: "Branch",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/hrms/org/branches",
    icon: "MapPin",
    requiredPermission: "administration.branches.read",
    columns: [
      { key: "name", label: "Branch Name", width: 220 },
      { key: "code", label: "Code", width: 110 },
      { key: "companyName", label: "Company", width: 200 },
      { key: "city", label: "City", width: 140 },
      { key: "state", label: "State", width: 140 },
      { key: "gstin", label: "GSTIN", width: 170 },
      { key: "isActive", label: "Status", type: "badge", width: 100 },
    ],
    filters: [{ key: "search", label: "Search branch", type: "text" }],
    form: {
      sections: [
        {
          key: "details",
          label: "Branch Details",
          fields: [
            { key: "name", label: "Branch Name", type: "text", required: true, span: 2 },
            { key: "code", label: "Branch Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 2 },
            { key: "companyId", label: "Company", type: "lookup", lookupEndpoint: "/administration/companies", required: true, span: 2 },
            { key: "gstin", label: "GSTIN", type: "text", span: 2 },
            { key: "addressLine1", label: "Address", type: "textarea", span: 2 },
            { key: "city", label: "City", type: "text", span: 1 },
            { key: "state", label: "State", type: "text", span: 1 },
            { key: "pincode", label: "PIN Code", type: "text", span: 1 },
            { key: "isActive", label: "Active", type: "boolean", span: 1 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Branch", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },

  "administration.audit-logs": {
    pageKey: "administration.audit-logs",
    title: "Audit Trail",
    subTitle: "Comprehensive immutable record of user logins, data mutations, and system events.",
    entityName: "AuditLog",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/administration/audit-logs",
    icon: "FileSearch",
    requiredPermission: "administration.audit.read",
    columns: [
      { key: "performedAt", label: "Timestamp", type: "datetime", width: 180 },
      { key: "performedByName", label: "User", width: 180 },
      { key: "action", label: "Action", type: "badge", width: 120 },
      { key: "entityName", label: "Entity", width: 160 },
      { key: "entityId", label: "Record ID", width: 180 },
      { key: "ipAddress", label: "IP Address", width: 140 },
    ],
    filters: [
      { key: "search", label: "Search records", type: "text" },
      { key: "entityName", label: "Entity Filter", type: "text" },
    ],
    actions: [
      { key: "export", label: "Export Audit Log", variant: "secondary", icon: "Download" },
    ],
  },

  "platform.documents": {
    pageKey: "platform.documents",
    title: "Document Vault",
    subTitle: "Centralized enterprise document management, attachments, agreements, and policies.",
    entityName: "Document",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/documents",
    icon: "Folder",
    requiredPermission: "documents.read",
    columns: [
      { key: "title", label: "Document Name", width: 240 },
      { key: "category", label: "Category", type: "badge", width: 140 },
      { key: "module", label: "Module", width: 130 },
      { key: "size", label: "File Size", width: 110 },
      { key: "uploadedByName", label: "Uploaded By", width: 160 },
      { key: "createdAt", label: "Uploaded Date", type: "date", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search documents", type: "text" },
    ],
    form: {
      sections: [
        {
          key: "upload",
          label: "Document Metadata",
          fields: [
            { key: "title", label: "Document Title", type: "text", required: true, span: 2 },
            { key: "category", label: "Category", type: "text", required: true, span: 1 },
            { key: "module", label: "Module / Domain", type: "text", required: true, span: 1 },
            { key: "description", label: "Description / Summary", type: "textarea", span: 2 },
            { key: "file", label: "Upload File", type: "file", required: true, span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Upload Document", variant: "primary", icon: "Upload" },
    ],
  },

  "administration.security-sessions": {
    pageKey: "administration.security-sessions",
    title: "Active Device Sessions",
    subTitle: "Monitor active login sessions, trusted devices, IP locations, and security revocations.",
    entityName: "Session",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/security/sessions",
    icon: "ShieldAlert",
    requiredPermission: "security.sessions.read",
    columns: [
      { key: "device", label: "Device / Browser", width: 220 },
      { key: "ipAddress", label: "IP Address", width: 140 },
      { key: "location", label: "Location", width: 160 },
      { key: "lastActiveAt", label: "Last Active", type: "datetime", width: 170 },
      { key: "status", label: "Session Status", type: "badge", width: 120 },
    ],
    filters: [
      { key: "search", label: "Search sessions", type: "text" },
    ],
    actions: [
      { key: "terminate-all", label: "Revoke Other Sessions", variant: "danger", icon: "LogOut" },
    ],
  },

  "administration.number-ranges": {
    pageKey: "administration.number-ranges",
    title: "Document Number Ranges Master",
    subTitle: "Configure multi-company ERP document numbering sequences, prefixes, padding length, and live counter rules.",
    entityName: "BusinessIdSequence",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/administration/number-ranges",
    icon: "Hash",
    requiredPermission: "administration.settings.read",
    columns: [
      { key: "entityName", label: "Document / Entity", width: 180 },
      { key: "companyTag", label: "Scope / Company", type: "badge", width: 170 },
      { key: "prefix", label: "Prefix", width: 110 },
      { key: "currentValue", label: "Current Counter", type: "number", width: 130 },
      { key: "padding", label: "Padding Digits", type: "number", width: 120 },
      { key: "preview", label: "Live Next Sequence Preview", width: 220 },
      { key: "fiscalYear", label: "Fiscal Year", width: 120 },
    ],
    filters: [
      { key: "search", label: "Search sequences", type: "text" },
      { key: "entityName", label: "Filter Entity", type: "text" },
    ],
    form: {
      sections: [
        {
          key: "scope",
          label: "Hierarchy Scope & Entity",
          fields: [
            { key: "entityName", label: "Document / Entity Name", type: "text", required: true, span: 2, placeholder: "e.g. SalesInvoice, Employee, PurchaseOrder" },
            { key: "companyId", label: "Target Subsidiary / Company (Optional)", type: "lookup", lookupEndpoint: "/administration/companies", span: 1 },
            { key: "projectId", label: "Target Project (Optional)", type: "lookup", lookupEndpoint: "/projects", span: 1 },
          ],
        },
        {
          key: "numbering",
          label: "Numbering Rules & Padding",
          fields: [
            { key: "prefix", label: "Series Base Prefix", type: "text", required: true, span: 1, placeholder: "e.g. INV-, PO-, EMP-" },
            { key: "padding", label: "Sequential Padding Digits (3-10)", type: "number", required: true, span: 1, placeholder: "5" },
            { key: "currentValue", label: "Initial / Current Counter", type: "number", required: true, span: 1, placeholder: "0" },
            { key: "fiscalYear", label: "Fiscal Year Cycle (Optional)", type: "text", span: 1, placeholder: "e.g. 2026-27" },
            { key: "namingPattern", label: "Custom Formula Pattern (Optional)", type: "text", span: 2, placeholder: "e.g. {COMPANY}-{PREFIX}-{YEAR}-{NUM}" },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Sequence Rule", variant: "primary", icon: "Plus" },
    ],
  },

  "administration.payment-terms": {
    pageKey: "administration.payment-terms",
    title: "Payment Terms Master",
    subTitle: "Commercial payment schedules, cash discounts, and credit terms according to SAP OBB8.",
    entityName: "PaymentTerm",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/payment-terms",
    icon: "CreditCard",
    requiredPermission: "administration.settings.read",
    columns: [
      { key: "termCode", label: "Term Code", width: 130 },
      { key: "description", label: "Description", width: 240 },
      { key: "netDays", label: "Net Days", type: "number", width: 110 },
      { key: "discountPercentage", label: "Discount %", type: "number", width: 120 },
      { key: "discountDays", label: "Discount Days", type: "number", width: 130 },
      { key: "isActive", label: "Status", type: "badge", width: 100 },
    ],
    filters: [
      { key: "search", label: "Search terms", type: "text" },
    ],
    form: {
      sections: [
        {
          key: "terms",
          label: "Terms Configuration",
          fields: [
            { key: "termCode", label: "Term Code (e.g. NET30, 2/10NET30)", type: "text", required: true, span: 1 },
            { key: "description", label: "Description", type: "text", required: true, span: 2 },
            { key: "netDays", label: "Net Due Days", type: "number", required: true, span: 1 },
            { key: "discountPercentage", label: "Early Payment Discount (%)", type: "number", span: 1 },
            { key: "discountDays", label: "Discount Window (Days)", type: "number", span: 1 },
            { key: "isActive", label: "Active", type: "boolean", span: 1 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Payment Term", variant: "primary", icon: "Plus" },
    ],
  },
  "administration.org-chart": {
    pageKey: "administration.org-chart",
    title: "Organizational Hierarchy Chart",
    subTitle: "Enterprise reporting tree, direct/indirect reporting lines, and span of control.",
    entityName: "OrgNode",
    moduleKey: "administration",
    viewType: "table",
    apiEndpoint: "/api/v1/hrms/employees",
    icon: "Network",
    requiredPermission: "administration.org_chart.read",
    columns: [
      { key: "fullName", label: "Employee Name", width: 220 },
      { key: "employeeCode", label: "Code", width: 120 },
      { key: "designationName", label: "Designation", width: 200 },
      { key: "departmentName", label: "Department", width: 180 },
      { key: "managerName", label: "Reports To", width: 200 },
    ],
    filters: [
      { key: "search", label: "Search employee or manager", type: "text" },
    ],
    form: {
      sections: [],
    },
    actions: [
      { key: "export", label: "Export Hierarchy", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalEmployees", label: "Total Headcount", icon: "Users", color: "indigo" },
      { key: "departmentsCount", label: "Active Departments", icon: "Building2", color: "green" },
    ],
  },
};
