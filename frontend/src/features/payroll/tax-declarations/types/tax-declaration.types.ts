export type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

export type TaxDeclarationRecord = {
  id: string;
  employeeId?: string;
  employeeName: string;
  financialYear: number;
  regime: string;
  declaredAmount: number;
  approvedAmount: number;
  section80C_Total?: number;
  section80D_Total?: number;
  section80G_Donation?: number;
  rentPaid?: number;
  proofSubmitted?: boolean;
  status: string;
};

export type TaxDeclarationFormState = {
  employeeId: string;
  financialYear: string;
  regime: string;
  section80C_Total: string;
  section80D_Total: string;
  section80G_Donation: string;
  rentPaid: string;
  proofSubmitted: boolean;
};
