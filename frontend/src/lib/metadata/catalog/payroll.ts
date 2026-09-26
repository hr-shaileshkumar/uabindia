import { PageSchema } from "../types";

export const payrollSchemas: Record<string, PageSchema> = {
  "payroll.runs": {
    pageKey: "payroll.runs",
    title: "Payroll Execution Batches",
    subTitle: "Monthly payroll processing cycles, calculation runs, bank payouts, and pay-slips.",
    entityName: "PayrollRun",
    moduleKey: "payroll",
    viewType: "table",
    apiEndpoint: "/payroll/runs",
    icon: "PlayCircle",
    requiredPermission: "payroll.runs.read",
    columns: [
      { key: "id", label: "Batch ID", width: 120 },
      { key: "runDate", label: "Processing Date", type: "date", width: 140 },
      { key: "totalGross", label: "Gross Payroll", type: "currency", width: 140 },
      { key: "totalDeductions", label: "Total Deductions", type: "currency", width: 140 },
      { key: "totalNet", label: "Net Payable", type: "currency", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 120 },
      { key: "createdAt", label: "Executed On", type: "datetime", width: 160 },
    ],
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Draft", label: "Draft" },
          { value: "Processing", label: "Processing" },
          { value: "Completed", label: "Completed" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "run",
          label: "Execute New Payroll Cycle",
          fields: [
            { key: "companyId", label: "Company", type: "lookup", lookupEndpoint: "/administration/companies", required: true, span: 2 },
            { key: "runDate", label: "Payroll Run Date", type: "date", required: true, span: 1 },
            {
              key: "payrollMonth",
              label: "Salary Month",
              type: "select",
              required: true,
              options: [
                { value: "1", label: "January" },
                { value: "2", label: "February" },
                { value: "3", label: "March" },
                { value: "4", label: "April" },
                { value: "5", label: "May" },
                { value: "6", label: "June" },
                { value: "7", label: "July" },
                { value: "8", label: "August" },
                { value: "9", label: "September" },
                { value: "10", label: "October" },
                { value: "11", label: "November" },
                { value: "12", label: "December" },
              ],
              span: 1,
            },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Execute Payroll Run", variant: "primary", icon: "Play" },
      { key: "export", label: "Download Bank Transfer File", variant: "secondary", icon: "Download" },
    ],
    kpis: [
      { key: "totalPayout", label: "Monthly Net Payout", icon: "IndianRupee", color: "indigo" },
      { key: "employeesProcessed", label: "Processed Staff", icon: "Users", color: "green" },
      { key: "complianceDeductions", label: "Statutory PF/ESI", icon: "ShieldCheck", color: "blue" },
    ],
  },

  "payroll.payslips": {
    pageKey: "payroll.payslips",
    title: "Employee Payslips",
    subTitle: "Monthly itemized salary statements, tax withholding, and direct PDF downloads.",
    entityName: "Payslip",
    moduleKey: "payroll",
    viewType: "table",
    apiEndpoint: "/payroll/payslips",
    icon: "FileText",
    requiredPermission: "payroll.payslips.read",
    columns: [
      { key: "employeeCode", label: "Code", width: 110 },
      { key: "employeeName", label: "Employee", width: 220 },
      { key: "month", label: "Month", type: "number", width: 90 },
      { key: "year", label: "Year", type: "number", width: 90 },
      { key: "gross", label: "Gross Earnings", type: "currency", width: 140 },
      { key: "totalDeductions", label: "Deductions", type: "currency", width: 130 },
      { key: "net", label: "Net Salary", type: "currency", width: 140 },
      { key: "status", label: "Status", type: "badge", width: 110 },
    ],
    filters: [
      { key: "search", label: "Search employee", type: "text" },
      {
        key: "month",
        label: "Month",
        type: "select",
        options: [
          { value: "1", label: "Jan" },
          { value: "2", label: "Feb" },
          { value: "3", label: "Mar" },
          { value: "4", label: "Apr" },
          { value: "5", label: "May" },
          { value: "6", label: "Jun" },
          { value: "7", label: "Jul" },
          { value: "8", label: "Aug" },
          { value: "9", label: "Sep" },
          { value: "10", label: "Oct" },
          { value: "11", label: "Nov" },
          { value: "12", label: "Dec" },
        ],
      },
    ],
    actions: [
      { key: "download", label: "Download Payslip", variant: "primary", icon: "Download" },
      { key: "export", label: "Export CSV", variant: "ghost", icon: "FileSpreadsheet" },
    ],
  },

  "payroll.structures": {
    pageKey: "payroll.structures",
    title: "Salary Structures",
    subTitle: "CTC breakdown templates, basic salary formulas, allowances, and statutory contributions.",
    entityName: "PayrollStructure",
    moduleKey: "payroll",
    viewType: "table",
    apiEndpoint: "/payroll/structures",
    icon: "Sliders",
    requiredPermission: "payroll.structures.read",
    columns: [
      { key: "name", label: "Structure Name", width: 240 },
      { key: "description", label: "Description", width: 300 },
      { key: "effectiveFrom", label: "Effective Date", type: "date", width: 130 },
      { key: "isDefault", label: "Default Template", type: "badge", width: 130 },
    ],
    filters: [{ key: "search", label: "Search structure", type: "text" }],
    form: {
      sections: [
        {
          key: "details",
          label: "Structure Definition",
          fields: [
            { key: "name", label: "Structure Name", type: "text", required: true, span: 2 },
            { key: "effectiveFrom", label: "Effective From", type: "date", required: true, span: 1 },
            { key: "isDefault", label: "Default Structure", type: "boolean", span: 1 },
            { key: "description", label: "Description", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add Structure", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  },
};
