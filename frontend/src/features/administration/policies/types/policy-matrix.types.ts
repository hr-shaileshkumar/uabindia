/**
 * Universal Policy Management & Category Registry Architecture
 * Designed for Bavya Health Services Pvt. Ltd. Enterprise HRMS/ERP
 */

export type PolicyCategory =
  | "HR_CORE"
  | "ATTENDANCE_TIMESHEET"
  | "LEAVE"
  | "PAYROLL_COMPENSATION"
  | "STATUTORY_COMPLIANCE"
  | "RECRUITMENT"
  | "EMPLOYEE_LIFECYCLE"
  | "TRAVEL_EXPENSE"
  | "PERFORMANCE"
  | "DISCIPLINE_RELATIONS"
  | "ASSET_ADMIN"
  | "DOCUMENT_KYC"
  | "IT_ERP"
  | "SEPARATION";

export interface PolicyCategoryMeta {
  code: PolicyCategory;
  name: string;
  description: string;
  icon: string;
  count?: number;
}

export const POLICY_CATEGORIES: PolicyCategoryMeta[] = [
  {
    code: "HR_CORE",
    name: "HR Core Policies",
    description: "Employee Master, Confirmation, Probation, Transfer, Promotion, Demotion, and Hierarchy.",
    icon: "Users",
  },
  {
    code: "ATTENDANCE_TIMESHEET",
    name: "Attendance & Timesheet",
    description: "Shifts, Grace Period, Overtime, WFH, Field Geofencing, FRS Biometric, Missed Punch, and Regularization.",
    icon: "Clock",
  },
  {
    code: "LEAVE",
    name: "Leave & Time-Off",
    description: "CL, SL, EL/PL, Maternity, Paternity, Comp-Off, LWP, Holidays, Carry-Forward, and Encashment.",
    icon: "Calendar",
  },
  {
    code: "PAYROLL_COMPENSATION",
    name: "Payroll & Compensation",
    description: "Salary Structures, Increments, Deductions, Loans, Advances, Bonuses, Arrears, and F&F.",
    icon: "BadgePercent",
  },
  {
    code: "STATUTORY_COMPLIANCE",
    name: "Statutory & Compliance",
    description: "PF, ESI, Professional Tax, TDS, Gratuity, Bonus Act, Minimum Wages, and CLRA Labour Returns.",
    icon: "ShieldCheck",
  },
  {
    code: "RECRUITMENT",
    name: "Recruitment & Onboarding",
    description: "Requisitions, Interview Panels, Candidate Screening, Background Verification, and Offer Letters.",
    icon: "UserPlus",
  },
  {
    code: "EMPLOYEE_LIFECYCLE",
    name: "Employee Lifecycle",
    description: "End-to-end journey: Joining → Probation → Confirmation → Transfer → Promotion → Exit.",
    icon: "Activity",
  },
  {
    code: "TRAVEL_EXPENSE",
    name: "Travel & Expenses",
    description: "Tour TA/DA, Local Conveyance, Hotel Slabs, Mileage/Fuel, Advances, and Settlement Rules.",
    icon: "MapPin",
  },
  {
    code: "PERFORMANCE",
    name: "Performance & Appraisal",
    description: "KPI/KRA Frameworks, Rating Scales, Appraisal Cycles, Performance Increments, and PIPs.",
    icon: "TrendingUp",
  },
  {
    code: "DISCIPLINE_RELATIONS",
    name: "Discipline & Employee Relations",
    description: "Code of Conduct, Misconduct, Show-Cause, Suspension, Domestic Enquiry, Grievance, and PoSH.",
    icon: "Scale",
  },
  {
    code: "ASSET_ADMIN",
    name: "Asset & Administration",
    description: "Laptop/Device Allocation, ID Cards, Uniforms, Vehicle Fleet, Handover, and Damaged Asset Recovery.",
    icon: "Laptop",
  },
  {
    code: "DOCUMENT_KYC",
    name: "Document & KYC",
    description: "Aadhaar, PAN, Bank KYC, Degree Verification, Digital Document Management, and Expiry Alerts.",
    icon: "FileText",
  },
  {
    code: "IT_ERP",
    name: "IT & ERP Security",
    description: "RBAC, Maker-Checker, Approval Matrix, 2FA/MFA, Session Policies, IP Restrictions, and Data Privacy.",
    icon: "Lock",
  },
  {
    code: "SEPARATION",
    name: "Separation & Offboarding",
    description: "Resignation, Notice Period Buyout, Exit Clearance, Asset Recovery, F&F, and Relieving Letters.",
    icon: "LogOut",
  },
];

export type EmploymentType = "Permanent" | "Contract" | "Intern" | "DoctorConsultant" | "Probationary";

export interface PolicyApplicabilityScope {
  companyIds?: string[];
  branchIds?: string[];          // e.g. ["Hosp-Patna-Main", "Clinic-Ranchi-01"]
  departmentIds?: string[];      // e.g. ["Clinical", "Nursing", "ICU", "Diagnostics", "Administration"]
  employmentTypes?: EmploymentType[];
  grades?: string[];             // e.g. ["Band-A", "Band-B", "Executive", "Senior Consultant"]
  excludedEmployeeIds?: string[];
}

export interface WorkflowApprovalStep {
  level: number;
  role: "ReportingManager" | "DepartmentHead" | "HR" | "Finance" | "MedicalDirector" | "ManagingDirector";
  slaHours: number;
  canReject: boolean;
  canRequestClarification: boolean;
}

export interface PolicyApprovalWorkflow {
  workflowType: "AutoApprove" | "SingleLevel" | "MultiLevel" | "ThresholdBased";
  thresholdAmount?: number;
  thresholdDays?: number;
  levels: WorkflowApprovalStep[];
  allowEmployeeDispute: boolean;
  disputeWindowDays?: number;
  autoApproveOnSlaExpiry?: boolean;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: string;               // e.g. "1.0", "1.1", "2.0"
  effectiveFrom: string;         // ISO Date "YYYY-MM-DD"
  effectiveTo?: string | null;   // Null means active indefinitely
  status: "Active" | "Draft" | "Archived";
  changeLogReason: string;
  authorName: string;
  approvedByName?: string;
  approvedAt?: string;
  applicability: PolicyApplicabilityScope;
  ruleConfig: Record<string, any>;
  approvalWorkflow: PolicyApprovalWorkflow;
}

export interface PolicyMaster {
  id: string;
  code: string;                  // e.g. "ATT_LATE_COMING_01", "PAY_STAT_PF_01"
  category: PolicyCategory;
  name: string;
  description: string;
  companyId?: string | null;
  projectId?: string | null;
  isMandatoryAcknowledgment: boolean; // Must employees digitally sign/read?
  isSystemCritical: boolean;          // Statutory or financial compliance critical
  priority: number;                   // Lower number = higher resolution priority
  status: "Active" | "Draft" | "Archived";
  totalVersions: number;
  activeVersion?: PolicyVersion;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyImpactSimulationInput {
  policyCode: string;
  proposedRuleConfig: Record<string, any>;
  evaluationMonth: string;            // e.g. "2026-08"
  departmentFilter?: string;
}

export interface PolicyImpactSimulationResult {
  policyCode: string;
  totalEvaluatedEmployees: number;
  totalImpactedEmployees: number;
  percentageImpacted: number;
  financialVarianceEstimate: number; // positive = company cost increases, negative = cost decreases
  disputeRiskScore: "Low" | "Medium" | "High";
  keyFindings: string[];
  sampleComparisons: {
    employeeId: string;
    employeeName: string;
    department: string;
    currentOutcome: string;
    simulatedOutcome: string;
    financialDelta: number;
  }[];
}

export interface PolicyAcknowledgmentRecord {
  id: string;
  policyId: string;
  policyVersion: string;
  employeeId: string;
  employeeName: string;
  acknowledgedAt: string;
  ipAddress?: string;
  digitalSignatureRef?: string;
}

export interface PolicyFieldDefinition {
  key: string;
  label: string;
  type: "number" | "text" | "boolean" | "select";
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[] | { label: string; value: string | number }[];
  required?: boolean;
  helpText?: string;
  section?: string;
  visible?: boolean;
  readOnly?: boolean;
}

export interface PolicyUiSchemaCategory {
  code: PolicyCategory;
  name: string;
  icon: string;
  description?: string;
  visible: boolean;
  editable: boolean;
  fieldDefinitions?: PolicyFieldDefinition[];
  defaultRuleConfig?: Record<string, any>;
}

export interface PolicyEvaluationRequest {
  policyCode: string;
  employeeId?: string;
  department?: string;
  employmentType?: string;
  branchId?: string;
  context?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  isApplicable: boolean;
  policyCode: string;
  policyName: string;
  version: string;
  decision: "Approved" | "Violation" | "DeductionApplicable" | "WithinGrace" | "Warning" | "RequiresExtension" | "RequiresApproval" | "NotApplicable";
  isCompliant: boolean;
  message: string;
  deductionDays: number;
  financialDelta: number;
  requiredApprovals: any;
  allowDispute: boolean;
  disputeWindowDays: number;
  evaluatedRules: Record<string, any>;
}

export interface PolicyUiSchemaResponse {
  serverVersion: string;
  authority: string;
  scope?: {
    companyId?: string | null;
    projectId?: string | null;
  };
  permissions: {
    canCreatePolicy: boolean;
    canPublishVersion: boolean;
    canDeletePolicy: boolean;
    canSimulate: boolean;
    canOverrideExceptions: boolean;
    canManageDefinitions?: boolean;
  };
  categories: PolicyUiSchemaCategory[];
}

export interface PolicyRuleDefinition {
  id?: string;
  tenantId?: string;
  companyId?: string | null;
  projectId?: string | null;
  category: string;
  policyCode: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: "number" | "text" | "boolean" | "select" | "date";
  section: string;
  defaultValue: string;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
  unit?: string | null;
  optionsJson?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  isVisible: boolean;
  isReadOnly: boolean;
  displayOrder: number;
  status: string;
}



