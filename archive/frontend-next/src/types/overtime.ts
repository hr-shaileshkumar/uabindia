// Overtime Tracking Types

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  requestDate: Date;
  overtimeDate: Date;
  overtimeHours: number;
  startTime: string;
  endTime: string;
  reason: string;
  projectName?: string;
  approvedBy?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Withdrawn';
  submittedDate?: Date;
  approvalDate?: Date;
  rejectionReason?: string;
}

export interface OvertimeApproval {
  id: string;
  overtimeRequestId: string;
  approvedBy: string;
  approvalDate: Date;
  approvalStatus: 'Approved' | 'Rejected';
  approverComments?: string;
  approvalLevel: 'Manager' | 'Senior Manager' | 'HR';
}

export interface OvertimeCompensation {
  id: string;
  employeeId: string;
  compensationType: 'Cash' | 'CompensatoryOff' | 'Both';
  overtimeHours: number;
  compensationMonth: Date;
  compensationAmount?: number;
  compensatoryOffGiven?: number;
  compensatoryOffTaken?: number;
  status: 'Pending' | 'Processing' | 'Completed';
}

export interface OvertimePolicy {
  id: string;
  companyId: string;
  maxOvertimeHoursPerMonth: number;
  maxOvertimeHoursPerWeek: number;
  maxConsecutiveOvertimeDays: number;
  minimumRest: number; // in hours between shifts
  compensationRate: number; // multiplier for cash compensation
  effectiveDate: Date;
  status: 'Active' | 'Inactive';
}

export interface OvertimeCalculation {
  id: string;
  overtimeRequestId: string;
  baseSalary: number;
  hourlyRate: number;
  overtimeHours: number;
  calculatedAmount: number;
  complianceNotes?: string;
  calculatedDate: Date;
}

export interface OvertimeReport {
  id: string;
  reportMonth: Date;
  reportType: 'Monthly' | 'Quarterly' | 'Annual';
  totalOvertimeHours: number;
  totalOvertimeCost: number;
  employeesInvolved: number;
  reportGeneratedDate: Date;
  generatedBy: string;
}

export interface CreateOvertimeRequest {
  overtimeDate: Date;
  overtimeHours: number;
  startTime: string;
  endTime: string;
  reason: string;
  projectName?: string;
}

export interface ApproveOvertimeRequest {
  overtimeRequestId: string;
  approvalStatus: 'Approved' | 'Rejected';
  approverComments?: string;
}

export interface CreateCompensationRequest {
  employeeId: string;
  compensationType: 'Cash' | 'CompensatoryOff' | 'Both';
  overtimeHours: number;
  compensationMonth: Date;
}
