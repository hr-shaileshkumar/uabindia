/**
 * Core Domain Types - Backend Authoritative
 */

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  companyId?: string;
  tenantId?: string;
  isActive: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface Module {
  key: string;
  name: string;
  displayName?: string;
  icon?: string;
  description?: string;
  basePath?: string;
  subModules?: SubModule[];
  isEnabled: boolean;
  order?: number;
}

export interface SubModule {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  order?: number;
}

export interface ModulesResponse {
  modules: Module[];
  version?: string;
}

export interface Company {
  id: string;
  tenantId?: string;
  tenantName?: string;
  name: string;
  code?: string;
  isActive: boolean;
  logoUrl?: string;
  financialYearStart?: string | null;
  financialYearEnd?: string | null;
  projects?: Project[];
}

export interface Project {
  id: string;
  tenantId?: string;
  companyId: string;
  companyName?: string;
  projectCode: string;
  name: string;
  description?: string;
  projectType: string;
  priority: string;
  status: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget?: number;
  actualCost?: number;
  currencyCode: string;
  clientName?: string;
  contractNumber?: string;
  billingType?: string;
  completionPercentage: number;
  projectManagerId?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface PermissionRecord {
  id: string;
  name: string;
  description?: string | null;
  module: string;
  action: string;
}

export interface PermissionsResponse {
  permissions: PermissionRecord[];
}

export interface HelpdeskTicketRecord {
  id: string;
  ticketNumber: string;
  subject: string;
  requester?: string;
  category?: string | null;
  priority?: string | null;
  assignedTo?: string | null;
  status?: string | null;
  createdAt: string;
  slaDueAt?: string | null;
}

export interface HelpdeskTicketsResponse {
  tickets?: HelpdeskTicketRecord[];
  records?: HelpdeskTicketRecord[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ContactSubmissionRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  companyName?: string | null;
  subject?: string | null;
  message: string;
  source?: string | null;
  isResolved: boolean;
  createdAt: string;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmissionRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface RecycleBinLogRecord {
  id: string;
  tenantId?: string;
  entityName?: string | null;
  entityId?: string | null;
  action?: string | null;
  performedAt: string;
  performedBy?: string | null;
  ip?: string | null;
}

export interface RecycleBinResponse {
  logs: RecycleBinLogRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface DeviceSessionRecord {
  id: string;
  deviceId: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface DeviceSessionsResponse {
  sessions: DeviceSessionRecord[];
}

export interface HolidayRecord {
  id: string;
  name: string;
  date: string;
  type?: string | null;
  isOptional?: boolean;
  description?: string | null;
}

export interface EnabledModuleRecord {
  key: string;
  name: string;
  displayName: string;
  icon?: string | null;
  description?: string | null;
  basePath?: string | null;
  isEnabled: boolean;
  order?: number;
}

export interface EnabledModulesResponse {
  modules: EnabledModuleRecord[];
}

export interface EntityFieldDefinitionRecord {
  id: string;
  entityName: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  options?: string[] | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder?: number;
  section?: string | null;
}

export interface EntityFieldDefinitionsResponse {
  definitions: EntityFieldDefinitionRecord[];
}

export interface CommunicationTemplateRecord {
  id: string;
  name: string;
  subject: string;
  message: string;
  triggerEvent: string;
  language: string;
  status: string;
  templateKind: string;
}

export interface CommunicationTemplatesResponse {
  records: CommunicationTemplateRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  module?: string | null;
  category?: string | null;
  contentType?: string | null;
  fileSizeBytes?: number;
  description?: string | null;
  createdAt: string;
}

export interface WorkflowDefinitionRecord {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  steps?: { stepOrder: number; roleRequired: string; approvalType?: string }[];
}

export interface WorkflowDefinitionsResponse {
  definitions: WorkflowDefinitionRecord[];
}

export interface IntegrationRecord {
  id?: string;
  connectorKey?: string;
  name?: string;
  provider?: string;
  category?: string;
  status?: string;
  lastTestedAt?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  config?: Record<string, string | null | undefined>;
}

export interface IntegrationSyncLogRecord {
  id: string;
  connectorKey?: string;
  direction?: string;
  operation?: string;
  status?: string;
  recordsProcessed?: number;
  message?: string | null;
  startedAt?: string;
  completedAt?: string | null;
}

export interface IntegrationsResponse {
  integrations: IntegrationRecord[];
}

export interface ModuleCatalogRecord {
  key: string;
  name: string;
  isEnabled: boolean;
  version?: string;
}

export interface ModuleCatalogResponse {
  modules: ModuleCatalogRecord[];
}

export interface OrgStructureRecord {
  id: string;
  tenantId?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  city?: string | null;
  state?: string | null;
  gstin?: string | null;
  isWarehouse?: boolean;
  grade?: string | null;
  level?: string | null;
  costCenterType?: string | null;
}

export interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
}

export interface SearchResult {
  title: string;
  subtitle?: string;
  path: string;
  module: string;
  category: "module" | "page" | "action";
  icon?: string;
}

export interface FinancialYear {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  newJoinersMTD: number;
  exitsMTD: number;
  openPositions: number;
  presentToday: number;
  absentToday: number;
  lateCheckins: number;
  attendancePctMTD: number;
  pendingLeaves: number;
  approvedLeavesMTD: number;
  leaveAlerts: number;
  attendanceTrend: number[];
  headcountTrend: number[];
  attritionTrend: number[];
  activity: unknown[];
}

export interface PayrollOverviewStats {
  totalRuns: number;
  completedRuns: number;
  draftRuns: number;
  totalPayslips: number;
  totalPayout: number;
}

export interface LeaveRequestSummary {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  leavePolicyId?: string | null;
  fromDate: string;
  toDate: string;
  days: number;
  period?: string | null;
  status?: string | null;
  reason?: string | null;
}

export interface LeaveRequestsResponse {
  requests: LeaveRequestSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PayrollRunSummary {
  id: string;
  companyId?: string | null;
  runDate: string;
  status?: string | null;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, string | number | boolean>;
}

/** Generic wrapper for paginated list API responses. */
export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
}

/** Generic wrapper for single-resource API responses. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── HRMS Domain Types ──────────────────────────────────────────────────────

export type EmployeeStatus = "Active" | "Inactive" | "Terminated" | "OnLeave";

export interface Employee {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  projectId?: string;
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  status?: EmployeeStatus;
  joiningDate?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  managerId?: string;
  managerName?: string;
  employmentType?: string;
  workLocation?: string;
  city?: string;
  state?: string;
  workEmail?: string;
  personalEmail?: string;
  dateOfJoining?: string;
  pan?: string;
  uan?: string;
  aadhaar?: string;
  esiNumber?: string;
  pfNumber?: string;
  bankName?: string;
  bankIfsc?: string;
  bankAccountNumber?: string;
  monthlyCtc?: number;
  basicSalary?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  companyId?: string;
  parentDepartmentId?: string;
  managerId?: string;
  isActive: boolean;
  employeeCount?: number;
}

export interface Designation {
  id: string;
  name: string;
  code?: string;
  departmentId?: string;
  level?: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: "Present" | "Absent" | "HalfDay" | "Late" | "Holiday" | "WeekOff";
  hoursWorked?: number;
  remarks?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  isNightShift?: boolean;
  isActive: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  code?: string;
  maxDaysPerYear?: number;
  isPaid: boolean;
  isCarryForward: boolean;
  isActive: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedAt?: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  balance: number;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  hours: number;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface Recruitment {
  id: string;
  jobTitle: string;
  departmentId?: string;
  departmentName?: string;
  vacancies: number;
  status: "Open" | "Closed" | "OnHold";
  postedDate?: string;
  closingDate?: string;
  description?: string;
}

export interface Candidate {
  id: string;
  recruitmentId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: "Applied" | "Screening" | "Interview" | "Offered" | "Hired" | "Rejected";
  resumeUrl?: string;
  appliedAt?: string;
}

// ─── Payroll Domain Types ────────────────────────────────────────────────────

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: "Draft" | "Processing" | "Approved" | "Paid" | "Cancelled";
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
  employeeCount?: number;
  processedAt?: string;
  approvedAt?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: "Draft" | "Generated" | "Sent";
  paymentDate?: string;
}

export interface SalaryComponent {
  id: string;
  name: string;
  code?: string;
  type: "Earning" | "Deduction" | "Employer";
  calculationType: "Fixed" | "Percentage";
  value?: number;
  isActive: boolean;
  isTaxable?: boolean;
}

// ─── Finance Domain Types ─────────────────────────────────────────────────────

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  parentId?: string;
  isGroup: boolean;
  balance?: number;
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  entryNumber?: string;
  date: string;
  description?: string;
  reference?: string;
  totalDebit?: number;
  totalCredit?: number;
  status: "Draft" | "Posted" | "Voided";
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountName?: string;
  description?: string;
  debit?: number;
  credit?: number;
}

export interface Payment {
  id: string;
  paymentDate?: string;
  amount?: number;
  paymentType?: "Inbound" | "Outbound";
  status?: "Pending" | "Completed" | "Failed" | "Cancelled";
  referenceNumber?: string;
  partyName?: string;
  accountId?: string;
  accountName?: string;
  notes?: string;
}

// ─── CRM Domain Types ────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  assignedTo?: string;
  value?: number;
  expectedCloseDate?: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  isActive: boolean;
  tags?: string[];
  createdAt?: string;
}

// ─── Expense Domain Types ─────────────────────────────────────────────────────

export type ExpenseStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Paid";

export interface Expense {
  id: string;
  employeeId?: string;
  employeeName?: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category?: string;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  approvedBy?: string;
  submittedAt?: string;
  costCenterId?: string;
  projectId?: string;
}

// ─── Helpdesk Domain Types ───────────────────────────────────────────────────

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketStatus = "Open" | "InProgress" | "Resolved" | "Closed";

export interface Ticket {
  id: string;
  ticketNumber?: string;
  subject: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category?: string;
  assignedTo?: string;
  reportedBy?: string;
  createdAt?: string;
  resolvedAt?: string;
  slaDeadline?: string;
}

// ─── Asset Domain Types ──────────────────────────────────────────────────────

export interface Asset {
  id: string;
  assetCode?: string;
  name: string;
  category?: string;
  status: "Available" | "Assigned" | "UnderMaintenance" | "Disposed";
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  assignedTo?: string;
  assignedToName?: string;
  location?: string;
  serialNumber?: string;
}

// ─── Fleet Domain Types ──────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
  status: "Available" | "InUse" | "Maintenance" | "Retired";
  driverName?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  mileage?: number;
}

// ─── Document Domain Types ───────────────────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  type?: string;
  size?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  folderId?: string;
  url?: string;
  version?: number;
  tags?: string[];
}

// ─── Notification Domain Types ────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt?: string;
  actionUrl?: string;
  category?: "Info" | "Warning" | "Success" | "Error";
}

// ─── Tour/Travel Domain Types ────────────────────────────────────────────────

export type TourStatus = "Draft" | "Submitted" | "Approved" | "InProgress" | "Completed" | "Rejected";

export interface TourRequest {
  id: string;
  employeeId?: string;
  employeeName?: string;
  destination: string;
  purpose?: string;
  departureDate: string;
  returnDate: string;
  estimatedCost?: number;
  actualCost?: number;
  status: TourStatus;
  approvedBy?: string;
  createdAt?: string;
}

// ─── Workflow Domain Types ────────────────────────────────────────────────────

export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Escalated";

export interface ApprovalRequest {
  id: string;
  type: string;
  subject: string;
  requestedBy?: string;
  requestedAt?: string;
  status: ApprovalStatus;
  priority?: "Low" | "Normal" | "High";
  dueDate?: string;
  notes?: string;
}
