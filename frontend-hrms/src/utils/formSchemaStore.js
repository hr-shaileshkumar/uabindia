// Central Form Schema Store & Registry for Uabindia HRMS
// Supports full multi-tab, dynamic fields, reordering, tab-shifting and validation
import { DEFAULT_SCHEMAS as META_SCHEMAS, getMetadataSchema, publishSchema, saveDraftSchema } from '../engine/metadataStore.js'

export const ENTITY_TYPES = [
  { id: 'employee', label: 'Employee Form', icon: 'UserCheck', description: 'Employee registration, profile info, statutory, bank, and experience' },
  { id: 'employee_directory', label: 'Employee Directory Columns (Table Roster)', icon: 'Users', description: 'Table roster columns, sort keys, status badges, and action buttons' },
  { id: 'project', label: 'Project Master Form', icon: 'FolderKanban', description: 'Project allocations, commercial, client and team milestones' },
  { id: 'project_directory', label: 'Project Directory Columns (Table Roster)', icon: 'FolderKanban', description: 'Project roster columns, client tags, dates, and status badges' },
  { id: 'company', label: 'Company Master Form', icon: 'Building2', description: 'Company legal registration, statutory compliance, banking, and policies' },
  { id: 'company_directory', label: 'Company Directory Columns (Table Roster)', icon: 'Building2', description: 'Company roster columns, CIN, PAN, key contact, and status badges' },
  { id: 'manpower_planning', label: 'Manpower Planning Form', icon: 'Briefcase', description: 'Headcount caps, fiscal year staffing budgets, and approved limits' },
  { id: 'job_postings', label: 'Job Postings Form', icon: 'Layers', description: 'Requisitions, portal sync, salary bands, and vacancies' },
  { id: 'candidates', label: 'Candidates & ATS Form', icon: 'UserCheck', description: 'Candidate applicant profile, expected CTC, evaluation and onboarding' },
  { id: 'transfers', label: 'Transfers & Station Relocations', icon: 'ArrowLeftRight', description: 'Inter-project reassignment, branch relocation, and deputation orders' },
  { id: 'promotions', label: 'Promotions & Cadre Elevations', icon: 'Award', description: 'Designation promotion, grade bands, and CTC hike revisions' },
  { id: 'training_programs', label: 'Training Programs Form', icon: 'GraduationCap', description: 'Curriculum schedules, trainers, mode and capacity caps' },
  { id: 'training_nominations', label: 'Training Nominations Form', icon: 'Award', description: 'Employee rosters, attendance tracking, test scores and certificates' },
  { id: 'ess_helpdesk', label: 'Employee Helpdesk Queries', icon: 'HelpCircle', description: 'Employee support tickets, SLA tracking, and grievance handling' },
  { id: 'ess_leaves', label: 'Employee Leave Ledger', icon: 'CalendarDays', description: 'Employee leave requests, quota tracking, and status columns' },
  { id: 'ess_payslips', label: 'Employee Payslip Register', icon: 'CreditCard', description: 'Employee salary statements, gross pay, deductions, and payout columns' },
  { id: 'tenant', label: 'Tenant Master Form', icon: 'ShieldCheck', description: 'Multi-tenant client accounts, custom subdomains, plans, and cloud policies' },
  { id: 'tenant_directory', label: 'Tenant Directory (SaaS Accounts)', icon: 'ShieldCheck', description: 'Multi-tenant client organizations, subdomains, plans, and isolation models' },
  { id: 'exit_management', label: 'Exit & Offboarding Form', icon: 'LogOut', description: 'Resignation, department clearance, asset handover, and exit interview' },
  { id: 'leave_management', label: 'Leave Request Form', icon: 'CalendarDays', description: 'Leave application, emergency contact, proof upload, and task handover' },
  { id: 'attendance_management', label: 'Attendance Tracking Form', icon: 'Clock', description: 'Biometric logs, FRS punches, shift allocations, and lock validations' },
  { id: 'payroll_management', label: 'Payroll Processing Form', icon: 'CreditCard', description: 'Payroll runs, statutory deductions (PF/ESIC/PT), and pay slips' },
  { id: 'performance_appraisals', label: 'Performance Appraisals Form', icon: 'Target', description: 'Self-assessment, KRA evaluation, manager rating, and goal setting' },
  { id: 'statutory_compliance', label: 'Statutory Compliance Form', icon: 'ShieldCheck', description: 'EPFO ECR challans, ESIC monthly contributions, and tax returns' },
  { id: 'country', label: 'Country Master', icon: 'Globe', description: 'National apex geographical boundary' },
  { id: 'zone', label: 'Zone Master', icon: 'Layers', description: 'Macro operational territory grouping states' },
  { id: 'region', label: 'Region Master', icon: 'Compass', description: 'Territorial administrative region' },
  { id: 'state', label: 'State Master', icon: 'Landmark', description: 'Provincial state boundary' },
  { id: 'cluster', label: 'Cluster Master', icon: 'Network', description: 'Operational cluster grouping districts' },
  { id: 'district', label: 'District Master', icon: 'MapPin', description: 'Administrative district jurisdiction' },
  { id: 'location', label: 'Posting Location Master', icon: 'Navigation', description: 'Physical station or clinic duty base' },
  { id: 'department', label: 'Department Master', icon: 'Briefcase', description: 'Functional department taxonomy' },
  { id: 'designation', label: 'Designation Master', icon: 'Award', description: 'Organizational rank and job title' },
  { id: 'branch', label: 'Branch Office Master', icon: 'GitBranch', description: 'Regional branch and clinic headquarters' },
  { id: 'reporting-hierarchy', label: 'Reporting Hierarchy Master', icon: 'Network', description: 'Managerial chains and approval rules' },
  { id: 'grade', label: 'Grade / Cadre Master', icon: 'ShieldCheck', description: 'Pay scale bands and probation rules' },
  { id: 'shift', label: 'Work Shift Master', icon: 'Clock', description: 'Attendance roster and shift timings' },
  { id: 'cost-center', label: 'Cost Center Master', icon: 'CreditCard', description: 'Financial cost allocation heads' },
  { id: 'employment-type', label: 'Employment Type Master', icon: 'Users', description: 'Contractual and statutory categories' },
  { id: 'holiday-calendar', label: 'Holiday Calendar Master', icon: 'Calendar', description: 'Statutory and public holidays' },
  { id: 'leave-type', label: 'Leave Type Master', icon: 'FileText', description: 'Absence quotas and encashment policies' }
]

export const FIELD_TYPES = [
  { id: 'text', label: 'Single Line Text', icon: 'Type', description: 'Names, codes, identifiers' },
  { id: 'number', label: 'Number / Amount', icon: 'Hash', description: 'Salaries, days, numeric values' },
  { id: 'date', label: 'Date Picker', icon: 'Calendar', description: 'Dates, birthdays, deadlines' },
  { id: 'select', label: 'Dropdown Select', icon: 'ChevronDown', description: 'Single selection from options' },
  { id: 'ref_select', label: 'Reference Select (API)', icon: 'Building2', description: 'Live companies or projects from master database' },
  { id: 'boolean', label: 'Yes / No Switch', icon: 'ToggleLeft', description: 'True/False checkbox toggle' },
  { id: 'textarea', label: 'Multi-line Paragraph', icon: 'AlignLeft', description: 'Feedback, addresses, descriptions' },
  { id: 'file', label: 'Document / File Upload', icon: 'Paperclip', description: 'ID proofs, certificates, PDFs' }
]

// Standard default schemas synced with metadataStore
export const DEFAULT_SCHEMAS = {
  employee: {
    entityType: 'employee',
    title: 'Employee Form',
    description: 'Comprehensive multi-tab employee registration, statutory compliance, bank details, and experience',
    tabs: [
      { id: 'tab_identity', title: 'Identity & Bio', label: 'Identity & Bio', icon: 'User' },
      { id: 'tab_org', title: 'Organization & Structure', label: 'Organization & Structure', icon: 'Building2' },
      { id: 'tab_employment', title: 'Employment Details', label: 'Employment Details', icon: 'Briefcase' },
      { id: 'tab_contact', title: 'Contact & Addresses', label: 'Contact & Addresses', icon: 'Phone' },
      { id: 'tab_statutory', title: 'Statutory & Payroll', label: 'Statutory & Payroll', icon: 'CreditCard' },
      { id: 'tab_bank', title: 'Bank Information', label: 'Bank Information', icon: 'Landmark' },
      { id: 'tab_education', title: 'Education & Academics', label: 'Education & Academics', icon: 'GraduationCap' },
      { id: 'tab_experience', title: 'Previous Experience', label: 'Previous Experience', icon: 'History' },
      { id: 'tab_custom', title: 'Custom Attributes', label: 'Custom Attributes', icon: 'Sparkles' },
    ],
    fields: [
      // Identity & Bio
      { id: 'employeeCode', tabId: 'tab_identity', label: 'Employee Code', type: 'text', required: true, width: '1/3', placeholder: 'CMP-PRJ-0001' },
      { id: 'salutation', tabId: 'tab_identity', label: 'Salutation', type: 'select', options: ['Mr.', 'Mrs.', 'Ms.', 'Dr.'], width: '1/3' },
      { id: 'firstName', tabId: 'tab_identity', label: 'First Name', type: 'text', required: true, width: '1/3', placeholder: 'First name' },
      { id: 'middleName', tabId: 'tab_identity', label: 'Middle Name', type: 'text', width: '1/3' },
      { id: 'lastName', tabId: 'tab_identity', label: 'Last Name', type: 'text', required: true, width: '1/3', placeholder: 'Last name' },
      { id: 'gender', tabId: 'tab_identity', label: 'Gender', type: 'select', required: true, width: '1/3', options: ['Male', 'Female', 'Other'] },
      { id: 'dob', tabId: 'tab_identity', label: 'Date of Birth', type: 'date', required: false, width: '1/3' },
      { id: 'maritalStatus', tabId: 'tab_identity', label: 'Marital Status', type: 'select', required: false, width: '1/3', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
      { id: 'bloodGroup', tabId: 'tab_identity', label: 'Blood Group', type: 'select', required: false, width: '1/3', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { id: 'status', tabId: 'tab_identity', label: 'Employee Status', type: 'select', required: true, width: '1/3', options: ['Active', 'Draft', 'Hold', 'Exited'], defaultValue: 'Active' },

      // Organization & Structure
      { id: 'companyId', tabId: 'tab_org', label: 'Corporate Entity / Company', type: 'ref_select', referenceApi: 'companies', required: true, width: '1/2' },
      { id: 'projectId', tabId: 'tab_org', label: 'Field Project / Program', type: 'ref_select', referenceApi: 'projects', width: '1/2' },
      { id: 'departmentName', tabId: 'tab_org', label: 'Department', type: 'text', required: true, width: '1/2', placeholder: 'e.g. Technology' },
      { id: 'designationName', tabId: 'tab_org', label: 'Designation', type: 'text', required: true, width: '1/2', placeholder: 'e.g. Senior Officer' },
      { id: 'branchName', tabId: 'tab_org', label: 'Branch / Posting Station', type: 'text', width: '1/2' },
      { id: 'locationName', tabId: 'tab_org', label: 'Posting Location', type: 'text', width: '1/2' },
      { id: 'reportingManagerL1', tabId: 'tab_org', label: 'Reporting Lead (Level 1)', type: 'text', width: '1/3' },
      { id: 'reportingManagerL2', tabId: 'tab_org', label: 'Department Head (Level 2)', type: 'text', width: '1/3' },
      { id: 'reportingManagerL3', tabId: 'tab_org', label: 'CHRO / Director (Level 3)', type: 'text', width: '1/3' },

      // Employment Details
      { id: 'employmentType', tabId: 'tab_employment', label: 'Employment Type', type: 'select', required: true, width: '1/3', options: ['Full Time', 'Permanent Full-Time', 'Contract', 'Intern', 'Part Time'] },
      { id: 'grade', tabId: 'tab_employment', label: 'Grade / Cadre', type: 'text', width: '1/3', placeholder: 'e.g. M3, L2' },
      { id: 'offerDate', tabId: 'tab_employment', label: 'Offer Date', type: 'date', width: '1/3' },
      { id: 'joiningDate', tabId: 'tab_employment', label: 'Joining Date', type: 'date', required: true, width: '1/3' },
      { id: 'confirmationDate', tabId: 'tab_employment', label: 'Confirmation Date', type: 'date', width: '1/3' },
      { id: 'noticePeriodDays', tabId: 'tab_employment', label: 'Notice Period (Days)', type: 'number', width: '1/3', defaultValue: 30 },
      { id: 'attendanceDeviceId', tabId: 'tab_employment', label: 'FRS / Biometric Machine ID', type: 'text', width: '1/2', placeholder: 'e.g. FR-PAT-09' },
      { id: 'punchId', tabId: 'tab_employment', label: 'Punch / Card ID', type: 'text', width: '1/2' },

      // Contact & Addresses
      { id: 'mobile', tabId: 'tab_contact', label: 'Primary Mobile Number', type: 'text', required: true, width: '1/2', placeholder: '10-digit mobile' },
      { id: 'alternateMobile', tabId: 'tab_contact', label: 'Alternate Mobile', type: 'text', width: '1/2' },
      { id: 'personalEmail', tabId: 'tab_contact', label: 'Personal Email Address', type: 'text', width: '1/2', placeholder: 'user@gmail.com' },
      { id: 'companyEmail', tabId: 'tab_contact', label: 'Official Corporate Email', type: 'text', width: '1/2', placeholder: 'user@company.com' },
      { id: 'currentAddress', tabId: 'tab_contact', label: 'Current Residential Address', type: 'textarea', width: 'full' },
      { id: 'permanentAddress', tabId: 'tab_contact', label: 'Permanent Domicile Address', type: 'textarea', width: 'full' },
      { id: 'emergencyContactName', tabId: 'tab_contact', label: 'Emergency Contact Person', type: 'text', width: '1/3' },
      { id: 'emergencyRelation', tabId: 'tab_contact', label: 'Emergency Relationship', type: 'text', width: '1/3' },
      { id: 'emergencyPhone', tabId: 'tab_contact', label: 'Emergency Phone Number', type: 'text', width: '1/3' },

      // Statutory & Payroll
      { id: 'panNumber', tabId: 'tab_statutory', label: 'PAN Card Number', type: 'text', required: false, width: '1/2', placeholder: 'ABCDE1234F' },
      { id: 'aadhaarNumber', tabId: 'tab_statutory', label: 'Aadhaar Number', type: 'text', required: false, width: '1/2', placeholder: '12-digit UID' },
      { id: 'uanNumber', tabId: 'tab_statutory', label: 'UAN Number (EPFO)', type: 'text', width: '1/2' },
      { id: 'pfAccountNumber', tabId: 'tab_statutory', label: 'PF Account Number', type: 'text', width: '1/2' },
      { id: 'esiNumber', tabId: 'tab_statutory', label: 'ESIC Insurance Number', type: 'text', width: '1/2' },
      { id: 'ctc', tabId: 'tab_statutory', label: 'Annual Cost to Company (CTC)', type: 'number', width: '1/2', placeholder: 'e.g. 600000' },

      // Bank Information
      { id: 'bankName', tabId: 'tab_bank', label: 'Bank Name', type: 'text', required: false, width: '1/2', placeholder: 'e.g. State Bank of India' },
      { id: 'accountHolderName', tabId: 'tab_bank', label: 'Beneficiary / Account Holder Name', type: 'text', width: '1/2' },
      { id: 'accountNumber', tabId: 'tab_bank', label: 'Bank Account Number', type: 'text', required: false, width: '1/2', placeholder: 'Account Number' },
      { id: 'ifscCode', tabId: 'tab_bank', label: 'IFSC Code', type: 'text', required: false, width: '1/2', placeholder: 'e.g. SBIN0001234' },
      { id: 'bankBranchName', tabId: 'tab_bank', label: 'Bank Branch Name', type: 'text', width: 'full' },

      // Education
      { id: 'qualification', tabId: 'tab_education', label: 'Highest Degree / Qualification', type: 'text', width: '1/2', placeholder: 'e.g. B.Tech / MBA' },
      { id: 'institution', tabId: 'tab_education', label: 'University / Institution', type: 'text', width: '1/2' },
      { id: 'yearOfPassing', tabId: 'tab_education', label: 'Year of Passing', type: 'number', width: '1/2' },
      { id: 'percentage', tabId: 'tab_education', label: 'Marks / Percentage / CGPA', type: 'text', width: '1/2' },

      // Previous Experience
      { id: 'previousCompanyName', tabId: 'tab_experience', label: 'Previous Employer', type: 'text', width: '1/2' },
      { id: 'previousDesignation', tabId: 'tab_experience', label: 'Previous Role / Designation', type: 'text', width: '1/2' },
      { id: 'previousSalary', tabId: 'tab_experience', label: 'Last Drawn CTC', type: 'number', width: '1/2' },
      { id: 'reasonForLeaving', tabId: 'tab_experience', label: 'Reason for Leaving', type: 'text', width: '1/2' },

      // Custom Attributes
      { id: 'specialMedicalNotes', tabId: 'tab_custom', label: 'Special Medical Notes', type: 'textarea', required: false, width: 'full', placeholder: 'Allergies, chronic conditions...' },
      { id: 'covidVaccinated', tabId: 'tab_custom', label: 'Fully Vaccinated', type: 'boolean', required: false, width: '1/2' },
    ]
  },

  project: {
    entityType: 'project',
    title: 'Project Initiation & Allocation Form',
    description: 'Track client commercial contracts, project deliverables, and team allocation',
    tabs: [
      { id: 'tab_info', title: 'Project Overview', label: 'Project Overview', icon: 'FolderKanban' },
      { id: 'tab_commercial', title: 'Commercial & Client', label: 'Commercial & Client', icon: 'CreditCard' },
      { id: 'tab_milestones', title: 'Milestones & SLA', label: 'Milestones & SLA', icon: 'Target' }
    ],
    fields: [
      { id: 'projectName', tabId: 'tab_info', label: 'Project Name', type: 'text', required: true, width: '1/2', placeholder: 'Project Title' },
      { id: 'projectCode', tabId: 'tab_info', label: 'Project Code', type: 'text', required: true, width: '1/2', placeholder: 'e.g. PRJ-2026-001' },
      { id: 'startDate', tabId: 'tab_info', label: 'Start Date', type: 'date', required: true, width: '1/2' },
      { id: 'endDate', tabId: 'tab_info', label: 'Estimated End Date', type: 'date', required: false, width: '1/2' },
      { id: 'status', tabId: 'tab_info', label: 'Project Status', type: 'select', required: true, width: '1/2', options: ['Active', 'On Hold', 'Completed', 'Archived'] },
      { id: 'description', tabId: 'tab_info', label: 'Scope of Work', type: 'textarea', required: false, width: 'full', placeholder: 'Detail project deliverables...' },

      { id: 'clientName', tabId: 'tab_commercial', label: 'Client / Stakeholder', type: 'text', required: true, width: '1/2', placeholder: 'Client Organization' },
      { id: 'billingType', tabId: 'tab_commercial', label: 'Billing Model', type: 'select', required: true, width: '1/2', options: ['Time & Material', 'Fixed Bid', 'Retainer', 'Milestone-based'] },
      { id: 'contractValue', tabId: 'tab_commercial', label: 'Total Contract Value (INR)', type: 'number', required: false, width: '1/2', placeholder: 'Amount in Lakhs' },
      { id: 'contractDocument', tabId: 'tab_commercial', label: 'Master Service Agreement (MSA)', type: 'file', required: false, width: 'full' },

      { id: 'targetMilestone1', tabId: 'tab_milestones', label: 'Milestone 1 Description', type: 'text', required: false, width: '1/2', placeholder: 'Initial Prototype' },
      { id: 'm1DueDate', tabId: 'tab_milestones', label: 'M1 Due Date', type: 'date', required: false, width: '1/2' },
      { id: 'slaPenaltyApplicable', tabId: 'tab_milestones', label: 'SLA Delay Penalty Applicable', type: 'boolean', required: false, width: '1/2' }
    ]
  },

  company: {
    entityType: 'company',
    title: 'Company Registration & Policy Form',
    description: 'Corporate registration, statutory certificates, and HR policy guidelines',
    tabs: [
      { id: 'tab_basic', title: 'Company Identity', label: 'Company Identity', icon: 'Building2' },
      { id: 'tab_statutory', title: 'Statutory Compliances', label: 'Statutory Compliances', icon: 'IdCard' },
      { id: 'tab_banking', title: 'Corporate Banking', label: 'Corporate Banking', icon: 'Landmark' },
      { id: 'tab_policies', title: 'Company Policy Rules', label: 'Company Policy Rules', icon: 'Sliders' }
    ],
    fields: [
      { id: 'companyName', tabId: 'tab_basic', label: 'Registered Legal Name', type: 'text', required: true, width: '1/2', placeholder: 'Full Legal Entity Name' },
      { id: 'companyCode', tabId: 'tab_basic', label: 'Company Short Code', type: 'text', required: true, width: '1/2', placeholder: 'e.g. CMP01' },
      { id: 'website', tabId: 'tab_basic', label: 'Official Website URL', type: 'text', required: false, width: '1/2', placeholder: 'https://company.com' },
      { id: 'logoUrl', tabId: 'tab_basic', label: 'Company Logo Upload', type: 'file', required: false, width: '1/2' },

      { id: 'cin', tabId: 'tab_statutory', label: 'Corporate Identification No (CIN)', type: 'text', required: false, width: '1/2', placeholder: '21-digit CIN' },
      { id: 'panNumber', tabId: 'tab_statutory', label: 'Company PAN Number', type: 'text', required: true, width: '1/2', placeholder: 'ABCDE1234F' },
      { id: 'gstin', tabId: 'tab_statutory', label: 'GSTIN Registration', type: 'text', required: false, width: '1/2', placeholder: '15-digit GSTIN' },
      { id: 'pfRegistrationCode', tabId: 'tab_statutory', label: 'EPFO Establishment Code', type: 'text', required: false, width: '1/2' },

      { id: 'bankName', tabId: 'tab_banking', label: 'Primary Operating Bank', type: 'text', required: false, width: '1/2', placeholder: 'e.g. State Bank of India' },
      { id: 'accountNumber', tabId: 'tab_banking', label: 'Current Account Number', type: 'text', required: false, width: '1/2' },
      { id: 'ifscCode', tabId: 'tab_banking', label: 'RTGS / IFSC Code', type: 'text', required: false, width: '1/2' },

      { id: 'probationMonths', tabId: 'tab_policies', label: 'Standard Probation Period (Months)', type: 'select', required: true, width: '1/2', options: ['3 Months', '6 Months', '1 Year', 'No Probation'] },
      { id: 'annualPaidLeaves', tabId: 'tab_policies', label: 'Annual Paid Leaves Entitlement', type: 'number', required: true, width: '1/2', placeholder: 'e.g. 18' }
    ]
  },

  exit: {
    entityType: 'exit',
    title: 'Employee Separation & Clearance Clearance Form',
    description: 'Multi-department clearance form across IT, Finance, Operations, and HR',
    tabs: [
      { id: 'tab_resignation', title: '1. Resignation Info', label: '1. Resignation Info', icon: 'LogOut' },
      { id: 'tab_it', title: '2. IT & Gear Clearance', label: '2. IT & Gear Clearance', icon: 'Laptop' },
      { id: 'tab_finance', title: '3. Finance & Dues', label: '3. Finance & Dues', icon: 'CreditCard' },
      { id: 'tab_hr', title: '4. HR & Exit Interview', label: '4. HR & Exit Interview', icon: 'ShieldCheck' },
      { id: 'tab_clearance', title: '5. Final Handover Status', label: '5. Final Handover Status', icon: 'Sparkles' }
    ],
    fields: [
      { id: 'employeeId', tabId: 'tab_resignation', label: 'Employee ID', type: 'text', required: true, width: '1/2' },
      { id: 'resignationDate', tabId: 'tab_resignation', label: 'Resignation Submission Date', type: 'date', required: true, width: '1/2' },
      { id: 'requestedRelievingDate', tabId: 'tab_resignation', label: 'Requested Relieving Date', type: 'date', required: true, width: '1/2' },
      { id: 'reasonForLeaving', tabId: 'tab_resignation', label: 'Reason for Departure', type: 'select', required: true, width: '1/2', options: ['Better Opportunity / CTC', 'Higher Studies', 'Relocation', 'Personal / Family', 'Health Reasons', 'Career Transition'] },
      { id: 'resignationLetter', tabId: 'tab_resignation', label: 'Resignation Email / Letter Copy', type: 'file', required: false, width: 'full' },

      { id: 'laptopReturned', tabId: 'tab_it', label: 'Assigned Laptop & Charger Returned', type: 'boolean', required: true, width: '1/2' },
      { id: 'emailAccountRevoked', tabId: 'tab_it', label: 'Corporate Email & Slack Deactivated', type: 'boolean', required: true, width: '1/2' },
      { id: 'idCardReturned', tabId: 'tab_it', label: 'Biometric Access & ID Card Handed Over', type: 'boolean', required: true, width: '1/2' },
      { id: 'itRemarks', tabId: 'tab_it', label: 'IT System Admin Remarks', type: 'textarea', required: false, width: 'full' },

      { id: 'salaryHoldApplied', tabId: 'tab_finance', label: 'Hold Final Month Salary for F&F', type: 'boolean', required: true, width: '1/2' },
      { id: 'loanDuesPending', tabId: 'tab_finance', label: 'Any Pending Salary Advance / Loan (INR)', type: 'number', required: false, width: '1/2', defaultValue: 0 },
      { id: 'travelReimbursementsCleared', tabId: 'tab_finance', label: 'All TA/DA Travel Claims Settled', type: 'boolean', required: true, width: '1/2' },

      { id: 'exitInterviewConducted', tabId: 'tab_hr', label: 'Formal Exit Interview Completed', type: 'boolean', required: true, width: '1/2' },
      { id: 'feedbackWorkCulture', tabId: 'tab_hr', label: 'Work Culture & Team Rating (1-5)', type: 'select', required: true, width: '1/2', options: ['5 - Excellent', '4 - Very Good', '3 - Average', '2 - Needs Improvement', '1 - Poor'] },
      { id: 'eligibleForRehire', tabId: 'tab_hr', label: 'Eligible for Re-Hire in Future', type: 'boolean', required: true, width: '1/2' },
      { id: 'detailedHrFeedback', tabId: 'tab_hr', label: 'HR Interview Observations', type: 'textarea', required: false, width: 'full', placeholder: 'Key reasons, constructive suggestions...' },

      { id: 'approverSignedDoc', tabId: 'tab_clearance', label: 'Combined No-Dues Signed Clearance PDF', type: 'file', required: false, width: 'full' },
      { id: 'relievingLetterIssued', tabId: 'tab_clearance', label: 'Relieving & Experience Certificate Dispatched', type: 'boolean', required: true, width: '1/2' }
    ]
  },

  leave: {
    entityType: 'leave',
    title: 'Absence & Leave Application Form',
    description: 'Standard employee leave submission with proof uploads',
    tabs: [
      { id: 'tab_leave_details', title: 'Leave Details', label: 'Leave Details', icon: 'CalendarDays' },
      { id: 'tab_handover', title: 'Coverage & Contact', label: 'Coverage & Contact', icon: 'Users' }
    ],
    fields: [
      { id: 'leaveType', tabId: 'tab_leave_details', label: 'Leave Category', type: 'select', required: true, width: '1/2', options: ['Casual Leave (CL)', 'Sick Leave (SL)', 'Earned Leave (EL)', 'Maternity / Paternity', 'Bereavement', 'Compensatory Off'] },
      { id: 'fromDate', tabId: 'tab_leave_details', label: 'From Date', type: 'date', required: true, width: '1/2' },
      { id: 'toDate', tabId: 'tab_leave_details', label: 'To Date', type: 'date', required: true, width: '1/2' },
      { id: 'halfDay', tabId: 'tab_leave_details', label: 'Half Day Option', type: 'select', required: false, width: '1/2', options: ['Full Day', 'First Half Only', 'Second Half Only'] },
      { id: 'reason', tabId: 'tab_leave_details', label: 'Reason for Leave', type: 'textarea', required: true, width: 'full', placeholder: 'Provide genuine reason...' },
      { id: 'medicalProof', tabId: 'tab_leave_details', label: 'Medical Certificate (If SL > 2 days)', type: 'file', required: false, width: 'full' },

      { id: 'handoverColleague', tabId: 'tab_handover', label: 'Delegated / Handover Colleague', type: 'text', required: false, width: '1/2', placeholder: 'Name of team member covering tasks' },
      { id: 'emergencyPhone', tabId: 'tab_handover', label: 'Emergency Contact Number', type: 'text', required: true, width: '1/2', placeholder: '10-digit number while on leave' }
    ]
  },

  performance: {
    entityType: 'performance',
    title: 'Performance Appraisal & Goals Matrix',
    description: 'Annual or quarterly review questionnaire',
    tabs: [
      { id: 'tab_self', title: 'Self Review', label: 'Self Review', icon: 'User' },
      { id: 'tab_goals', title: 'Goals & Targets', label: 'Goals & Targets', icon: 'Target' },
      { id: 'tab_feedback', title: 'Manager Rating', label: 'Manager Rating', icon: 'Award' }
    ],
    fields: [
      { id: 'keyAchievements', tabId: 'tab_self', label: 'Top 3 Key Accomplishments in this Cycle', type: 'textarea', required: true, width: 'full', placeholder: 'Highlight milestones reached...' },
      { id: 'challengesFaced', tabId: 'tab_self', label: 'Key Bottlenecks or Roadblocks Encountered', type: 'textarea', required: false, width: 'full', placeholder: 'What held you back?' },

      { id: 'goalTarget1', tabId: 'tab_goals', label: 'Target Milestone 1', type: 'text', required: true, width: '1/2' },
      { id: 'goalCompletionPct', tabId: 'tab_goals', label: 'Completion Percentage (%)', type: 'number', required: true, width: '1/2', placeholder: '0 - 100' },
      { id: 'trainingRequested', tabId: 'tab_goals', label: 'Desired Upskilling / Technical Training', type: 'text', required: false, width: 'full', placeholder: 'e.g. AWS Cloud Certification' },

      { id: 'overallRating', tabId: 'tab_feedback', label: 'Manager Overall Rating (1-5)', type: 'select', required: true, width: '1/2', options: ['5 - Exceeds All Expectations', '4 - Consistently Exceeds', '3 - Meets Expectations', '2 - Needs Improvement', '1 - Unsatisfactory'] },
      { id: 'promotionRecommended', tabId: 'tab_feedback', label: 'Recommended for Promotion / Increment', type: 'boolean', required: true, width: '1/2' },
      { id: 'managerRemarks', tabId: 'tab_feedback', label: 'Manager Narrative & Guidance', type: 'textarea', required: true, width: 'full', placeholder: 'Detailed manager appraisal notes...' }
    ]
  },

  tenant: {
    entityType: 'tenant',
    title: 'Tenant Organization & Cloud Provisioning Form',
    description: 'Setup SaaS client accounts, custom subdomains, subscription plans, and security policies',
    tabs: [
      { id: 'tab_tenant_org', title: 'Organization Profile', label: 'Organization Profile', icon: 'Building2' },
      { id: 'tab_tenant_contact', title: 'Contact & Address', label: 'Contact & Address', icon: 'Phone' },
      { id: 'tab_tenant_plan', title: 'Plan & Quotas', label: 'Plan & Quotas', icon: 'CreditCard' },
      { id: 'tab_tenant_security', title: 'Security & Cloud Isolation', label: 'Security & Cloud Isolation', icon: 'ShieldCheck' }
    ],
    fields: [
      { id: 'companyName', tabId: 'tab_tenant_org', label: 'Tenant Legal Name', type: 'text', required: true, width: '1/2', placeholder: 'Enterprise Name' },
      { id: 'subdomain', tabId: 'tab_tenant_org', label: 'Custom Subdomain', type: 'text', required: true, width: '1/2', placeholder: 'e.g. mycompany' },
      { id: 'taxId', tabId: 'tab_tenant_org', label: 'Tax ID / GSTIN', type: 'text', required: false, width: '1/2' },
      { id: 'defaultCurrency', tabId: 'tab_tenant_org', label: 'Billing Currency', type: 'select', required: true, width: '1/2', options: ['INR', 'USD', 'EUR', 'GBP'], defaultValue: 'INR' },

      { id: 'contactPerson', tabId: 'tab_tenant_contact', label: 'Primary Contact Person', type: 'text', required: true, width: '1/2' },
      { id: 'contactEmail', tabId: 'tab_tenant_contact', label: 'Official Billing Email', type: 'text', required: true, width: '1/2', placeholder: 'admin@tenant.com' },
      { id: 'contactPhone', tabId: 'tab_tenant_contact', label: 'Contact Phone Number', type: 'text', required: true, width: '1/2' },
      { id: 'city', tabId: 'tab_tenant_contact', label: 'City', type: 'text', required: false, width: '1/2' },
      { id: 'state', tabId: 'tab_tenant_contact', label: 'State / Province', type: 'text', required: false, width: '1/2' },
      { id: 'country', tabId: 'tab_tenant_contact', label: 'Country', type: 'text', required: false, width: '1/2', defaultValue: 'India' },

      { id: 'planName', tabId: 'tab_tenant_plan', label: 'Subscription Tier', type: 'select', required: true, width: '1/2', options: ['Starter', 'Standard', 'Enterprise', 'Custom'], defaultValue: 'Standard' },
      { id: 'billingCycle', tabId: 'tab_tenant_plan', label: 'Billing Frequency', type: 'select', required: true, width: '1/2', options: ['Monthly', 'Quarterly', 'Yearly'], defaultValue: 'Yearly' },
      { id: 'maxUsers', tabId: 'tab_tenant_plan', label: 'Max Active Users Limit', type: 'number', required: true, width: '1/2', defaultValue: 50 },
      { id: 'maxProjects', tabId: 'tab_tenant_plan', label: 'Max Projects Limit', type: 'number', required: true, width: '1/2', defaultValue: 10 },

      { id: 'isolationModel', tabId: 'tab_tenant_security', label: 'Data Isolation Architecture', type: 'select', required: true, width: '1/2', options: ['SharedDatabase', 'SeparateSchema', 'DedicatedDatabase'], defaultValue: 'SharedDatabase' },
      { id: 'authPolicy', tabId: 'tab_tenant_security', label: 'Authentication Mode', type: 'select', required: true, width: '1/2', options: ['EmailPassword', 'SSO_SAML', 'SSO_OAuth2', 'MFA_Enforced'], defaultValue: 'EmailPassword' },
      { id: 'mfaEnforced', tabId: 'tab_tenant_security', label: 'Enforce Multi-Factor Auth (MFA)', type: 'boolean', required: false, width: '1/2', defaultValue: false },
      { id: 'isActive', tabId: 'tab_tenant_security', label: 'Tenant Live Status', type: 'boolean', required: true, width: '1/2', defaultValue: true }
    ]
  }
}

// Storage helpers directly using metadataStore for unified state
export function getFormSchema(entityType = 'employee', companyId = 'default') {
  // Check metadataStore first
  const metaKey = entityType === 'employee' ? 'employee_form' : entityType
  const schema = getMetadataSchema(metaKey, companyId)
  if (schema && Array.isArray(schema.tabs) && Array.isArray(schema.fields)) {
    // Ensure tabs have both title and label
    const normalizedTabs = schema.tabs.map(t => ({
      ...t,
      title: t.title || t.label,
      label: t.label || t.title
    }))
    return { ...schema, tabs: normalizedTabs }
  }

  // Fallback to DEFAULT_SCHEMAS
  return DEFAULT_SCHEMAS[entityType] || DEFAULT_SCHEMAS.employee
}

export async function saveFormSchema(entityType = 'employee', schema, companyId = 'default') {
  try {
    const metaKey = entityType === 'employee' ? 'employee_form' : entityType
    saveDraftSchema(metaKey, schema, companyId)
    await publishSchema(metaKey, companyId)

    // Legacy compatibility key
    const key = `hrms_dynamic_form_schema_${entityType}_${companyId || 'default'}`
    localStorage.setItem(key, JSON.stringify(schema))

    window.dispatchEvent(new CustomEvent('hrms:form-schema-updated', { detail: { entityType, companyId } }))
    window.dispatchEvent(new CustomEvent('hrms:metadata-updated', { detail: { schemaId: metaKey, schema } }))
    return true
  } catch (err) {
    console.error(`Failed saving schema for ${entityType}`, err)
    return false
  }
}

export function resetFormSchema(entityType = 'employee', companyId = 'default') {
  try {
    const metaKey = entityType === 'employee' ? 'employee_form' : entityType
    const def = DEFAULT_SCHEMAS[entityType] || DEFAULT_SCHEMAS.employee
    saveFormSchema(entityType, def, companyId)
    return def
  } catch (err) {
    return DEFAULT_SCHEMAS[entityType]
  }
}
