import type { ReactNode } from "react";

export type ProbationRecord = {
  id: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  companyId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  reviewScore?: number;
  managerName?: string;
  comments?: string;
};

export type ReviewFormState = {
  score: string;
  action: string;
  comments: string;
};
