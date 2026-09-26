import { PageSchema } from "../types";

export const crmSchemas: Record<string, PageSchema> = {
  "crm.leads": {
    pageKey: "crm.leads",
    title: "Leads Management",
    subTitle: "Inbound sales inquiries, marketing prospects, lead score, and qualification.",
    entityName: "Lead",
    moduleKey: "crm",
    viewType: "table",
    apiEndpoint: "/crm/leads",
    icon: "Target",
    requiredPermission: "crm.leads.read",
    columns: [
      { key: "leadName", label: "Lead Name", width: 200 },
      { key: "company", label: "Company", width: 200 },
      { key: "email", label: "Email", width: 220 },
      { key: "phone", label: "Phone", width: 140 },
      { key: "source", label: "Lead Source", width: 140 },
      { key: "stage", label: "Stage", type: "badge", width: 130 },
      { key: "estimatedValue", label: "Deal Value", type: "currency", width: 130 },
    ],
    filters: [
      { key: "search", label: "Search name, company, email", type: "text" },
      {
        key: "stage",
        label: "Stage",
        type: "select",
        options: [
          { value: "New", label: "New Lead" },
          { value: "Contacted", label: "Contacted" },
          { value: "Qualified", label: "Qualified" },
          { value: "Negotiation", label: "Negotiation" },
          { value: "Won", label: "Won" },
          { value: "Lost", label: "Lost" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "lead",
          label: "Lead Information",
          fields: [
            { key: "leadName", label: "Contact / Lead Name", type: "text", required: true, span: 1 },
            { key: "company", label: "Company Name", type: "text", span: 1 },
            { key: "email", label: "Email", type: "email", span: 1 },
            { key: "phone", label: "Phone", type: "tel", span: 1 },
            {
              key: "source",
              label: "Source",
              type: "select",
              options: [
                { value: "Website", label: "Website" },
                { value: "Referral", label: "Referral" },
                { value: "LinkedIn", label: "LinkedIn / Social" },
                { value: "ColdCall", label: "Cold Call / Outreach" },
              ],
              span: 1,
            },
            { key: "estimatedValue", label: "Estimated Deal Value", type: "currency", span: 1 },
            {
              key: "stage",
              label: "Stage",
              type: "select",
              options: [
                { value: "New", label: "New Lead" },
                { value: "Contacted", label: "Contacted" },
                { value: "Qualified", label: "Qualified" },
              ],
              span: 1,
            },
            { key: "notes", label: "Requirement Notes", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Lead", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Update", variant: "secondary", icon: "Pencil" },
      { key: "convert", label: "Convert to Customer", variant: "success", icon: "CheckCircle2" },
    ],
    kpis: [
      { key: "totalLeads", label: "Total Leads", icon: "Target", color: "indigo" },
      { key: "qualifiedLeads", label: "Qualified", icon: "CheckCircle2", color: "green" },
      { key: "pipelineValue", label: "Pipeline Value", icon: "IndianRupee", color: "blue" },
    ],
  },
};
