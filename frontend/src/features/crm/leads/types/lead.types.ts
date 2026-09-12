export type Lead = {
  id: string;
  leadName: string;
  leadCode?: string;
  customerName?: string;
  status?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  stage?: string;
  owner?: string;
};

export type LeadForm = {
  leadName: string;
  companyName: string;
  value: number;
  probability: number;
  stage: string;
  owner: string;
};

export const CRM_LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;
