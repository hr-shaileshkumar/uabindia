export type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

export type LoanRow = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  loanType?: string;
  principalAmount?: number;
  outstandingAmount?: number;
  emiAmount?: number;
  interestRate?: number;
  disbursementDate?: string;
  status?: string;
  installmentsPaid?: number;
  totalInstallments?: number;
};

export type LoanFormState = {
  employeeId: string;
  loanType: string;
  principalAmount: string;
  interestRate: string;
  emiAmount: string;
  totalInstallments: string;
  disbursementDate: string;
  purpose: string;
};

export const LOAN_TYPES = [
  "Personal Loan",
  "Home Loan Advance",
  "Vehicle Loan",
  "Education Loan",
  "Medical Emergency",
  "Festival Advance",
  "Salary Advance",
  "Other",
] as const;
