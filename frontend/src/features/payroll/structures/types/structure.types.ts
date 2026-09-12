export type PayrollStructure = {
  id: string;
  name?: string;
  description?: string;
  companyId?: string | null;
  projectId?: string | null;
  isDefault?: boolean;
  status?: string;
  createdAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export type StructureFormState = {
  name: string;
  description?: string;
  companyId?: string;
  projectId?: string;
  isDefault?: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};
