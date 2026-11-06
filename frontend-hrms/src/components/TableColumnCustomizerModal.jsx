import React, { useState, useEffect } from 'react'
import {
  X,
  Sliders,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  Database,
  Layers,
} from 'lucide-react'
import { saveSchemaToDb } from '../api/schemas'

export const DB_ATTRIBUTES_CATALOG = {
  employee_directory: [
    {
      category: 'Core Identification & Profile',
      attributes: [
        { key: 'code', label: 'Employee ID', format: 'code' },
        { key: 'name', label: 'Employee Name', format: 'avatar' },
        { key: 'salutation', label: 'Salutation', format: 'text' },
        { key: 'firstName', label: 'First Name', format: 'text' },
        { key: 'middleName', label: 'Middle Name', format: 'text' },
        { key: 'lastName', label: 'Last Name', format: 'text' },
        { key: 'gender', label: 'Gender', format: 'badge' },
        { key: 'dob', label: 'Date of Birth', format: 'date' },
        { key: 'bloodGroup', label: 'Blood Group', format: 'text' },
        { key: 'maritalStatus', label: 'Marital Status', format: 'text' },
        { key: 'status', label: 'Profile Status', format: 'badge' },
      ],
    },
    {
      category: 'Organization & Structure',
      attributes: [
        { key: 'designation', label: 'Role / Designation', format: 'text' },
        { key: 'department', label: 'Department', format: 'text' },
        { key: 'companyName', label: 'Corporate Entity', format: 'text' },
        { key: 'projectName', label: 'Assigned Project', format: 'text' },
        { key: 'branch', label: 'Branch / Station', format: 'text' },
        { key: 'location', label: 'Posting Location', format: 'text' },
        { key: 'grade', label: 'Grade / Cadre', format: 'text' },
        { key: 'reportingManagerL1', label: 'Reporting Lead L1', format: 'text' },
        { key: 'reportingManagerL2', label: 'Department Head L2', format: 'text' },
      ],
    },
    {
      category: 'Employment Terms & Lifecycle',
      attributes: [
        { key: 'employmentType', label: 'Employment Type', format: 'badge' },
        { key: 'offerDate', label: 'Offer Date', format: 'date' },
        { key: 'joiningDate', label: 'Date of Joining', format: 'date' },
        { key: 'confirmationDate', label: 'Confirmation Date', format: 'date' },
        { key: 'noticePeriodDays', label: 'Notice Period (Days)', format: 'text' },
        { key: 'attendanceDeviceId', label: 'Biometric FRS Device ID', format: 'code' },
        { key: 'punchId', label: 'Punch / Card ID', format: 'code' },
      ],
    },
    {
      category: 'Contact & Addresses',
      attributes: [
        { key: 'mobile', label: 'Primary Mobile', format: 'text' },
        { key: 'alternateMobile', label: 'Alternate Mobile', format: 'text' },
        { key: 'email', label: 'Official Corporate Email', format: 'text' },
        { key: 'personalEmail', label: 'Personal Email', format: 'text' },
        { key: 'currentAddress', label: 'Current Address', format: 'text' },
        { key: 'permanentAddress', label: 'Permanent Domicile Address', format: 'text' },
        { key: 'emergencyContactName', label: 'Emergency Contact Person', format: 'text' },
        { key: 'emergencyPhone', label: 'Emergency Phone', format: 'text' },
      ],
    },
    {
      category: 'Statutory Compliance & IDs',
      attributes: [
        { key: 'panNumber', label: 'PAN Number', format: 'code' },
        { key: 'aadhaarNumber', label: 'Aadhaar UIDAI', format: 'code' },
        { key: 'uanNumber', label: 'Universal Account (UAN)', format: 'code' },
        { key: 'pfAccountNumber', label: 'EPFO PF Account', format: 'code' },
        { key: 'esiNumber', label: 'ESIC Insurance Number', format: 'code' },
      ],
    },
    {
      category: 'Banking, Salary & Payroll',
      attributes: [
        { key: 'ctc', label: 'Annual CTC (₹)', format: 'currency' },
        { key: 'basicSalary', label: 'Monthly Basic Salary', format: 'currency' },
        { key: 'bankName', label: 'Bank Name', format: 'text' },
        { key: 'bankBranchName', label: 'Bank Branch', format: 'text' },
        { key: 'accountNumber', label: 'Bank Account Number', format: 'code' },
        { key: 'accountHolderName', label: 'Account Holder Name', format: 'text' },
        { key: 'ifscCode', label: 'IFSC Code', format: 'code' },
      ],
    },
    {
      category: 'Academics & Experience',
      attributes: [
        { key: 'qualification', label: 'Highest Qualification', format: 'text' },
        { key: 'institution', label: 'University / Institute', format: 'text' },
        { key: 'yearOfPassing', label: 'Passing Year', format: 'text' },
        { key: 'experienceYears', label: 'Total Experience (Years)', format: 'text' },
      ],
    },
  ],
  company_directory: [
    {
      category: 'Corporate Identity',
      attributes: [
        { key: 'companyCode', label: 'Company Code', format: 'code' },
        { key: 'companyName', label: 'Legal Company Name', format: 'text' },
        { key: 'tradeName', label: 'Trade / Brand Name', format: 'text' },
        { key: 'tenantName', label: 'Tenant Entity', format: 'text' },
        { key: 'status', label: 'Company Status', format: 'badge' },
      ],
    },
    {
      category: 'Contact & Location',
      attributes: [
        { key: 'contactPerson', label: 'Key Contact Person', format: 'text' },
        { key: 'contactEmail', label: 'Primary Contact Email', format: 'text' },
        { key: 'contactPhone', label: 'Primary Contact Phone', format: 'text' },
        { key: 'city', label: 'Operating City', format: 'text' },
        { key: 'state', label: 'State / Territory', format: 'text' },
        { key: 'postalCode', label: 'PIN / Postal Code', format: 'code' },
        { key: 'registeredAddress', label: 'Registered Office Address', format: 'text' },
      ],
    },
    {
      category: 'Statutory & Tax IDs',
      attributes: [
        { key: 'cinNumber', label: 'Corporate ID Number (CIN)', format: 'code' },
        { key: 'panNumber', label: 'Company Tax ID / PAN', format: 'code' },
        { key: 'gstinNumber', label: 'GSTIN Number', format: 'code' },
        { key: 'tanNumber', label: 'TDS Deduction Number (TAN)', format: 'code' },
        { key: 'pfRegistrationNumber', label: 'PF Establishment Code', format: 'code' },
        { key: 'esiRegistrationNumber', label: 'ESIC Establishment Code', format: 'code' },
      ],
    },
    {
      category: 'Banking & Accounts',
      attributes: [
        { key: 'bankName', label: 'Primary Bank Name', format: 'text' },
        { key: 'bankAccountNumber', label: 'Corporate Account Number', format: 'code' },
        { key: 'ifscCode', label: 'IFSC Code', format: 'code' },
      ],
    },
  ],
  project_directory: [
    {
      category: 'Project Specifications',
      attributes: [
        { key: 'projectCode', label: 'Project Code', format: 'code' },
        { key: 'projectName', label: 'Project Name', format: 'text' },
        { key: 'companyName', label: 'Corporate Entity', format: 'text' },
        { key: 'clientName', label: 'Client / Stakeholder', format: 'text' },
        { key: 'billingType', label: 'Billing Model', format: 'badge' },
        { key: 'status', label: 'Project Status', format: 'badge' },
      ],
    },
    {
      category: 'Timelines & Financials',
      attributes: [
        { key: 'startDate', label: 'Project Start Date', format: 'date' },
        { key: 'endDate', label: 'Target Completion Date', format: 'date' },
        { key: 'budgetAllocated', label: 'Allocated Budget', format: 'currency' },
        { key: 'currency', label: 'Operating Currency', format: 'text' },
        { key: 'location', label: 'Deployment Base', format: 'text' },
        { key: 'projectManager', label: 'Project Director / Manager', format: 'text' },
      ],
    },
  ],
  tenant_directory: [
    {
      category: 'Tenant Account',
      attributes: [
        { key: 'companyName', label: 'Tenant Legal Name', format: 'text' },
        { key: 'subdomain', label: 'Subdomain Routing', format: 'code' },
        { key: 'plan', label: 'Subscription Plan', format: 'badge' },
        { key: 'isolationModel', label: 'Data Isolation', format: 'text' },
        { key: 'status', label: 'Tenant Status', format: 'badge' },
      ],
    },
    {
      category: 'Administration & Quotas',
      attributes: [
        { key: 'contactPerson', label: 'Account Administrator', format: 'text' },
        { key: 'contactEmail', label: 'Primary Contact Email', format: 'text' },
        { key: 'contactPhone', label: 'Primary Contact Phone', format: 'text' },
        { key: 'maxUsers', label: 'Max Licensed Users', format: 'text' },
        { key: 'maxCompanies', label: 'Max Companies Quota', format: 'text' },
        { key: 'authPolicy', label: 'Authentication Policy', format: 'badge' },
      ],
    },
  ],
  user_directory: [
    {
      category: 'User Account Details',
      attributes: [
        { key: 'userName', label: 'Username / Handle', format: 'code' },
        { key: 'fullName', label: 'Full Name', format: 'text' },
        { key: 'mobileNumber', label: 'Mobile Phone', format: 'text' },
        { key: 'email', label: 'Email Address', format: 'text' },
        { key: 'roleName', label: 'Assigned Role', format: 'badge' },
        { key: 'companyName', label: 'Corporate Entity', format: 'text' },
        { key: 'isActive', label: 'Active Status', format: 'badge' },
        { key: 'createdAt', label: 'Registration Date', format: 'date' },
      ],
    },
  ],
  leave_management: [
    {
      category: 'Leave Application Details',
      attributes: [
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'employeeCode', label: 'Employee Code', format: 'code' },
        { key: 'leaveTypeName', label: 'Leave Type / Category', format: 'badge' },
        { key: 'startDate', label: 'Leave Start Date', format: 'date' },
        { key: 'endDate', label: 'Leave End Date', format: 'date' },
        { key: 'totalDays', label: 'Duration (Days)', format: 'text' },
        { key: 'reason', label: 'Application Reason', format: 'text' },
        { key: 'status', label: 'Approval Status', format: 'badge' },
        { key: 'appliedAt', label: 'Submission Timestamp', format: 'date' },
      ],
    },
  ],
  payroll_management: [
    {
      category: 'Payroll & Disbursal Attributes',
      attributes: [
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'employeeCode', label: 'Employee Code', format: 'code' },
        { key: 'basicPay', label: 'Monthly Basic Salary', format: 'currency' },
        { key: 'grossPay', label: 'Gross Salary Earnings', format: 'currency' },
        { key: 'pfEmployee', label: 'Employee EPF (12%)', format: 'currency' },
        { key: 'esicEmployee', label: 'Employee ESIC', format: 'currency' },
        { key: 'netPay', label: 'Final Net Salary', format: 'currency' },
      ],
    },
  ],
  performance_appraisals: [
    {
      category: 'Performance Appraisal Attributes',
      attributes: [
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'employeeCode', label: 'Employee Code', format: 'code' },
        { key: 'departmentName', label: 'Department / Unit', format: 'text' },
        { key: 'selfRating', label: 'Self-Rating Score', format: 'text' },
        { key: 'managerRating', label: 'Manager Score', format: 'text' },
        { key: 'finalScore', label: 'Final Score', format: 'text' },
        { key: 'status', label: 'Appraisal Stage', format: 'badge' },
      ],
    },
  ],
  statutory_compliance: [
    {
      category: 'Statutory Filing Attributes',
      attributes: [
        { key: 'statutoryType', label: 'Statutory Category (PF/ESIC/PT)', format: 'badge' },
        { key: 'periodMonth', label: 'Wage Period Month', format: 'text' },
        { key: 'periodYear', label: 'Wage Period Year', format: 'text' },
        { key: 'challanNumber', label: 'Challan / TRRN Receipt', format: 'code' },
        { key: 'totalEmployeesCovered', label: 'Covered Headcount', format: 'text' },
        { key: 'totalAmountPaid', label: 'Challan Amount Deposited', format: 'currency' },
        { key: 'filingStatus', label: 'Government Filing Status', format: 'badge' },
        { key: 'filingDate', label: 'Deposit / Payment Date', format: 'date' },
      ],
    },
  ],
  exit_management: [
    {
      category: 'Separation & Offboarding Attributes',
      attributes: [
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'employeeCode', label: 'Employee Code', format: 'code' },
        { key: 'departmentName', label: 'Department', format: 'text' },
        { key: 'resignationDate', label: 'Resignation Date', format: 'date' },
        { key: 'noticePeriodDays', label: 'Notice Period (Days)', format: 'text' },
        { key: 'requestedRelievingDate', label: 'Requested Relieving Date', format: 'date' },
        { key: 'reason', label: 'Separation Reason', format: 'text' },
        { key: 'status', label: 'Exit Workflow Status', format: 'badge' },
      ],
    },
  ],
  job_postings: [
    {
      category: 'Job Requisition Attributes',
      attributes: [
        { key: 'jobCode', label: 'Job Opening Code', format: 'code' },
        { key: 'jobTitle', label: 'Requisition Title', format: 'text' },
        { key: 'department', label: 'Department / Unit', format: 'text' },
        { key: 'vacancies', label: 'Approved Headcount', format: 'text' },
        { key: 'experienceRequired', label: 'Experience Level', format: 'text' },
        { key: 'salaryBracket', label: 'Compensation Bracket', format: 'text' },
        { key: 'portalPublished', label: 'Portal Live Status', format: 'badge' },
        { key: 'candidateCount', label: 'Applicant Count', format: 'text' },
      ],
    },
  ],
  candidate_pipeline: [
    {
      category: 'Candidate & ATS Attributes',
      attributes: [
        { key: 'candidateCode', label: 'Applicant Tracking Code', format: 'code' },
        { key: 'fullName', label: 'Candidate Full Name', format: 'text' },
        { key: 'jobTitle', label: 'Role Applied For', format: 'text' },
        { key: 'totalExperienceYears', label: 'Total Experience', format: 'text' },
        { key: 'expectedCtc', label: 'Expected Salary (CTC)', format: 'currency' },
        { key: 'currentStage', label: 'Recruitment Stage', format: 'badge' },
      ],
    },
  ],
  training_programs: [
    {
      category: 'Learning & Course Attributes',
      attributes: [
        { key: 'programCode', label: 'Course Curriculum Code', format: 'code' },
        { key: 'programTitle', label: 'Training Course Title', format: 'text' },
        { key: 'category', label: 'Competency Domain', format: 'text' },
        { key: 'startDate', label: 'Commencement Date', format: 'date' },
        { key: 'endDate', label: 'Conclusion Date', format: 'date' },
        { key: 'durationHours', label: 'Instruction Hours', format: 'text' },
        { key: 'trainerName', label: 'Instructor / Trainer', format: 'text' },
        { key: 'status', label: 'Delivery Status', format: 'badge' },
      ],
    },
  ],
  training_nominations: [
    {
      category: 'Trainee Nomination Attributes',
      attributes: [
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'employeeCode', label: 'Employee Code', format: 'code' },
        { key: 'department', label: 'Department', format: 'text' },
        { key: 'programTitle', label: 'Course Enrolled', format: 'text' },
        { key: 'attendanceStatus', label: 'Attendance Outcome', format: 'badge' },
        { key: 'score', label: 'Assessment Score', format: 'text' },
        { key: 'certificateIssued', label: 'Credential Issued', format: 'badge' },
      ],
    },
  ],
  dedicated_master: [
    {
      category: 'Master Entity Attributes',
      attributes: [
        { key: 'code', label: 'Entity Identification Code', format: 'code' },
        { key: 'name', label: 'Canonical Entity Name', format: 'text' },
        { key: 'parentName', label: 'Parent Boundary / Entity', format: 'text' },
        { key: 'operationalStation', label: 'Operational Station', format: 'text' },
        { key: 'sortOrder', label: 'Display Hierarchy Order', format: 'text' },
        { key: 'status', label: 'Record Active State', format: 'badge' },
      ],
    },
  ],
  transfers: [
    {
      category: 'Transfer & Relocation Attributes',
      attributes: [
        { key: 'transferCode', label: 'Transfer Order Code', format: 'code' },
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'fromLocation', label: 'Departure Location', format: 'text' },
        { key: 'toLocation', label: 'Destination Location', format: 'text' },
        { key: 'transferType', label: 'Transfer Category', format: 'text' },
        { key: 'effectiveDate', label: 'Relocation Date', format: 'date' },
        { key: 'relocationAllowance', label: 'Relocation Allowance', format: 'currency' },
        { key: 'status', label: 'Approval Status', format: 'badge' },
      ],
    },
  ],
  promotions: [
    {
      category: 'Promotion & Appraisal Attributes',
      attributes: [
        { key: 'promotionCode', label: 'Promotion Order Code', format: 'code' },
        { key: 'employeeName', label: 'Employee Name', format: 'avatar' },
        { key: 'currentDesignation', label: 'Current Designation', format: 'text' },
        { key: 'proposedDesignation', label: 'Elevated Designation', format: 'text' },
        { key: 'currentCtc', label: 'Current CTC (₹)', format: 'currency' },
        { key: 'proposedCtc', label: 'Proposed CTC (₹)', format: 'currency' },
        { key: 'hikePercentage', label: 'Hike Percentage', format: 'text' },
        { key: 'effectiveDate', label: 'Effective Date', format: 'date' },
        { key: 'status', label: 'Approval Status', format: 'badge' },
      ],
    },
  ],
}

const PRESET_COLUMNS = {
  employee_directory: [
    { key: 'code', label: 'Employee ID', format: 'code', sortable: true, width: 'w-36' },
    { key: 'name', label: 'Employee Name', format: 'avatar', sortable: true, width: 'w-52', nameKey: 'name' },
    { key: 'designation', label: 'Role / Designation', format: 'text', sortable: true, width: 'w-48', primaryKey: 'designation' },
    { key: 'department', label: 'Department', format: 'text', sortable: true, width: 'w-40', primaryKey: 'department' },
    { key: 'companyName', label: 'Corporate Entity', format: 'text', sortable: true, width: 'w-52', primaryKey: 'companyName' },
    { key: 'projectName', label: 'Assigned Project', format: 'text', sortable: true, width: 'w-48', primaryKey: 'projectName' },
    { key: 'employmentType', label: 'Employment Type', format: 'badge', sortable: true, width: 'w-36' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
    { key: 'mobile', label: 'Mobile Number', format: 'text', sortable: true, width: 'w-36' },
    { key: 'email', label: 'Official Email', format: 'text', sortable: true, width: 'w-48' },
    { key: 'joiningDate', label: 'Joining Date', format: 'date', sortable: true, width: 'w-32' },
  ],
  company_directory: [
    { key: 'companyCode', label: 'Company Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'companyName', label: 'Company Name', format: 'text', sortable: true, width: 'w-52' },
    { key: 'tenantName', label: 'Tenant Entity', format: 'text', sortable: true, width: 'w-44' },
    { key: 'contactPerson', label: 'Contact Person', format: 'text', sortable: true, width: 'w-40' },
    { key: 'contactEmail', label: 'Contact Email', format: 'text', sortable: true, width: 'w-48' },
    { key: 'city', label: 'City', format: 'text', sortable: true, width: 'w-32' },
    { key: 'state', label: 'State', format: 'text', sortable: true, width: 'w-32' },
    { key: 'panNumber', label: 'Tax ID / PAN', format: 'text', sortable: true, width: 'w-36' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  project_directory: [
    { key: 'projectCode', label: 'Project Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'projectName', label: 'Project Name', format: 'text', sortable: true, width: 'w-52' },
    { key: 'companyName', label: 'Corporate Entity', format: 'text', sortable: true, width: 'w-44' },
    { key: 'clientName', label: 'Client / Stakeholder', format: 'text', sortable: true, width: 'w-40' },
    { key: 'startDate', label: 'Start Date', format: 'date', sortable: true, width: 'w-32' },
    { key: 'endDate', label: 'Target Completion', format: 'date', sortable: true, width: 'w-32' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  tenant_directory: [
    { key: 'companyName', label: 'Tenant Legal Name', format: 'text', sortable: true, width: 'w-56' },
    { key: 'subdomain', label: 'Subdomain Routing', format: 'code', sortable: true, width: 'w-36' },
    { key: 'plan', label: 'Subscription Plan', format: 'badge', sortable: true, width: 'w-36' },
    { key: 'isolationModel', label: 'Data Isolation', format: 'text', sortable: true, width: 'w-36' },
    { key: 'contactEmail', label: 'Primary Contact', format: 'text', sortable: true, width: 'w-48' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  user_directory: [
    { key: 'user', label: 'User Identity', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'mobile', label: 'Mobile Contact', format: 'text', sortable: true, width: 'w-36' },
    { key: 'role', label: 'Role Tier', format: 'badge', sortable: true, width: 'w-40' },
    { key: 'company', label: 'Assigned Company', format: 'text', sortable: true, width: 'w-48' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'createdAt', label: 'Created Date', format: 'date', sortable: true, width: 'w-32' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  leave_management: [
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'leaveType', label: 'Leave Type', format: 'badge', sortable: true, width: 'w-36' },
    { key: 'duration', label: 'Duration Dates', format: 'date', sortable: true, width: 'w-44' },
    { key: 'days', label: 'Days', format: 'text', sortable: true, width: 'w-24' },
    { key: 'reason', label: 'Reason', format: 'text', sortable: true, width: 'w-48' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  payroll_management: [
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'basicPay', label: 'Basic Pay', format: 'currency', sortable: true, width: 'w-36' },
    { key: 'grossPay', label: 'Gross Pay', format: 'currency', sortable: true, width: 'w-36' },
    { key: 'pfEmployee', label: 'EPF (12%)', format: 'currency', sortable: true, width: 'w-32' },
    { key: 'esicEmployee', label: 'ESIC', format: 'currency', sortable: true, width: 'w-32' },
    { key: 'netPay', label: 'Net Salary', format: 'currency', sortable: true, width: 'w-36' },
    { key: 'actions', label: 'Breakdown', format: 'actions', align: 'right', width: 'w-28' },
  ],
  performance_appraisals: [
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'department', label: 'Department', format: 'text', sortable: true, width: 'w-40' },
    { key: 'selfRating', label: 'Self Rating', format: 'text', sortable: true, width: 'w-32' },
    { key: 'managerRating', label: 'Manager Rating', format: 'text', sortable: true, width: 'w-32' },
    { key: 'finalScore', label: 'Final Score', format: 'text', sortable: true, width: 'w-32' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-36' },
  ],
  statutory_compliance: [
    { key: 'statutoryType', label: 'Statutory Category', format: 'badge', sortable: true, width: 'w-40' },
    { key: 'period', label: 'Pay Period', format: 'text', sortable: true, width: 'w-36' },
    { key: 'challanNumber', label: 'Challan / TRRN Receipt', format: 'code', sortable: true, width: 'w-44' },
    { key: 'totalEmployeesCovered', label: 'Headcount', format: 'text', sortable: true, width: 'w-32' },
    { key: 'totalAmountPaid', label: 'Deposit Amount', format: 'currency', sortable: true, width: 'w-36' },
    { key: 'filingStatus', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'filingDate', label: 'Payment Date', format: 'date', align: 'right', width: 'w-32' },
  ],
  exit_management: [
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'department', label: 'Department', format: 'text', sortable: true, width: 'w-40' },
    { key: 'resignationDate', label: 'Resignation Date', format: 'date', sortable: true, width: 'w-36' },
    { key: 'noticePeriodDays', label: 'Notice Period', format: 'text', sortable: true, width: 'w-32' },
    { key: 'requestedRelievingDate', label: 'Target Relieving', format: 'date', sortable: true, width: 'w-36' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-44' },
  ],
  job_postings: [
    { key: 'jobCode', label: 'Job Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'jobTitle', label: 'Position Title', format: 'text', sortable: true, width: 'w-52' },
    { key: 'department', label: 'Department & Project', format: 'text', sortable: true, width: 'w-44' },
    { key: 'vacancies', label: 'Vacancies', format: 'text', sortable: true, width: 'w-24' },
    { key: 'experienceRequired', label: 'Experience', format: 'text', sortable: true, width: 'w-32' },
    { key: 'salaryBracket', label: 'Salary Bracket', format: 'text', sortable: true, width: 'w-36' },
    { key: 'portalPublished', label: 'Portal Live', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'candidateCount', label: 'Applicants', format: 'text', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-32' },
  ],
  candidate_pipeline: [
    { key: 'candidateCode', label: 'Candidate Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'fullName', label: 'Candidate Name', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'jobTitle', label: 'Role Requisition', format: 'text', sortable: true, width: 'w-48' },
    { key: 'contact', label: 'Contact Details', format: 'text', sortable: true, width: 'w-44' },
    { key: 'totalExperienceYears', label: 'Experience', format: 'text', sortable: true, width: 'w-28' },
    { key: 'expectedCtc', label: 'Expected CTC', format: 'currency', sortable: true, width: 'w-32' },
    { key: 'rating', label: 'Rating', format: 'text', sortable: true, width: 'w-24' },
    { key: 'currentStage', label: 'Pipeline Stage', format: 'badge', sortable: true, width: 'w-36' },
  ],
  training_programs: [
    { key: 'programCode', label: 'Program Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'programTitle', label: 'Program Title', format: 'text', sortable: true, width: 'w-52' },
    { key: 'category', label: 'Category & Mode', format: 'text', sortable: true, width: 'w-40' },
    { key: 'dates', label: 'Dates', format: 'date', sortable: true, width: 'w-40' },
    { key: 'durationHours', label: 'Duration', format: 'text', sortable: true, width: 'w-28' },
    { key: 'trainerName', label: 'Trainer', format: 'text', sortable: true, width: 'w-36' },
    { key: 'enrollment', label: 'Enrollment', format: 'text', sortable: true, width: 'w-28' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-32' },
  ],
  training_nominations: [
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'department', label: 'Department & Designation', format: 'text', sortable: true, width: 'w-48' },
    { key: 'program', label: 'Training Program', format: 'text', sortable: true, width: 'w-48' },
    { key: 'attendanceStatus', label: 'Attendance Status', format: 'badge', sortable: true, width: 'w-36' },
    { key: 'score', label: 'Score', format: 'text', sortable: true, width: 'w-24' },
    { key: 'certificate', label: 'Certificate', format: 'badge', sortable: true, width: 'w-32' },
    { key: 'actions', label: 'Update Action', format: 'actions', align: 'right', width: 'w-36' },
  ],
  dedicated_master: [
    { key: 'code', label: 'Record Code', format: 'code', sortable: true, width: 'w-32' },
    { key: 'name', label: 'Canonical Name', format: 'text', sortable: true, width: 'w-52' },
    { key: 'parentName', label: 'Parent Entity', format: 'text', sortable: true, width: 'w-44' },
    { key: 'operationalStation', label: 'Operational Unit', format: 'text', sortable: true, width: 'w-40' },
    { key: 'order', label: 'Display Order', format: 'text', sortable: true, width: 'w-24' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Actions', format: 'actions', align: 'right', width: 'w-28' },
  ],
  transfers: [
    { key: 'transferCode', label: 'Transfer Ref', format: 'code', sortable: true, width: 'w-32' },
    { key: 'employee', label: 'Employee', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'route', label: 'Departure → Destination', format: 'text', sortable: true, width: 'w-52' },
    { key: 'transferType', label: 'Transfer Type', format: 'text', sortable: true, width: 'w-40' },
    { key: 'effectiveDate', label: 'Effective Date', format: 'date', sortable: true, width: 'w-32' },
    { key: 'relocationAllowance', label: 'Relocation (₹)', format: 'currency', sortable: true, width: 'w-36' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Approval Action', format: 'actions', align: 'right', width: 'w-36' },
  ],
  promotions: [
    { key: 'promotionCode', label: 'Promotion Ref', format: 'code', sortable: true, width: 'w-32' },
    { key: 'employee', label: 'Employee Profile', format: 'avatar', sortable: true, width: 'w-52' },
    { key: 'roleProgression', label: 'Role Progression', format: 'text', sortable: true, width: 'w-52' },
    { key: 'compensationRevision', label: 'Compensation Revision', format: 'text', sortable: true, width: 'w-48' },
    { key: 'hikePercentage', label: 'Hike %', format: 'text', sortable: true, width: 'w-28' },
    { key: 'effectiveDate', label: 'Effective Date', format: 'date', sortable: true, width: 'w-32' },
    { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
    { key: 'actions', label: 'Approval Action', format: 'actions', align: 'right', width: 'w-36' },
  ],
}

const COLUMN_FORMATS = [
  { value: 'text', label: 'Text' },
  { value: 'code', label: 'Code (Monospace Pill)' },
  { value: 'avatar', label: 'Avatar & Name' },
  { value: 'badge', label: 'Status Badge' },
  { value: 'date', label: 'Date' },
  { value: 'currency', label: 'Currency (₹)' },
  { value: 'actions', label: 'Actions' },
]

export default function TableColumnCustomizerModal({
  isOpen,
  onClose,
  schema,
  tenantId = 'default',
  onSave,
}) {
  const [columns, setColumns] = useState([])
  const [selectedPreset, setSelectedPreset] = useState('')
  const [selectedAttrKey, setSelectedAttrKey] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [newColKey, setNewColKey] = useState('')
  const [newColLabel, setNewColLabel] = useState('')
  const [newColFormat, setNewColFormat] = useState('text')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Initialize columns from current schema
  useEffect(() => {
    if (isOpen && schema) {
      const existing = (schema.columns || []).map(col => ({
        ...col,
        visible: col.visible !== false,
      }))
      setColumns(existing)
      setError('')
      setSuccess(false)
      setSelectedPreset('')
      setSelectedAttrKey('')
      setIsCustomMode(false)
      setNewColKey('')
      setNewColLabel('')
      setNewColFormat('text')
    }
  }, [isOpen, schema])

  if (!isOpen || !schema) return null

  const rawSchemaId = schema.id || schemaIdProp || 'employee_directory'
  const schemaId = rawSchemaId === 'candidates' ? 'candidate_pipeline' : rawSchemaId
  const presetsForSchema = PRESET_COLUMNS[schemaId] || PRESET_COLUMNS[rawSchemaId] || []
  const catalogGroups = DB_ATTRIBUTES_CATALOG[schemaId] || DB_ATTRIBUTES_CATALOG[rawSchemaId] || []
  const existingKeys = new Set(columns.map(c => c.key || c.id))
  const availablePresets = presetsForSchema.filter(p => !existingKeys.has(p.key))

  // Toggle column visibility
  const handleToggleVisible = (key) => {
    setColumns(prev =>
      prev.map(c => {
        if ((c.key || c.id) === key) {
          return { ...c, visible: !c.visible }
        }
        return c
      })
    )
  }

  // Rename column display label
  const handleRenameLabel = (key, newLabel) => {
    setColumns(prev =>
      prev.map(c => {
        if ((c.key || c.id) === key) {
          return { ...c, label: newLabel }
        }
        return c
      })
    )
  }

  // Change cell format
  const handleChangeFormat = (key, format) => {
    setColumns(prev =>
      prev.map(c => {
        if ((c.key || c.id) === key) {
          return { ...c, format }
        }
        return c
      })
    )
  }

  // Move column order
  const handleMove = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= columns.length) return
    const updated = [...columns]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    setColumns(updated)
  }

  // Jump to sequence position
  const handleJumpSequence = (index, targetSequence) => {
    const targetIdx = targetSequence - 1
    if (targetIdx < 0 || targetIdx >= columns.length || targetIdx === index) return
    const updated = [...columns]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIdx, 0, moved)
    setColumns(updated)
  }

  // Add column from preset
  const handleAddPreset = () => {
    if (!selectedPreset) return
    const preset = presetsForSchema.find(p => p.key === selectedPreset)
    if (!preset) return

    setColumns(prev => [...prev, { ...preset, visible: true }])
    setSelectedPreset('')
  }

  // Select database attribute from catalog to auto-populate key, label and format
  const handleSelectAttribute = (attrKey) => {
    setSelectedAttrKey(attrKey)
    if (attrKey === '__custom__') {
      setIsCustomMode(true)
      setNewColKey('')
      setNewColLabel('')
      setNewColFormat('text')
      return
    }
    setIsCustomMode(false)
    if (!attrKey) {
      setNewColKey('')
      setNewColLabel('')
      setNewColFormat('text')
      return
    }
    // Lookup attribute in catalog
    let match = null
    for (const group of catalogGroups) {
      const found = group.attributes.find(a => a.key === attrKey)
      if (found) {
        match = found
        break
      }
    }
    if (match) {
      setNewColKey(match.key)
      setNewColLabel(match.label)
      setNewColFormat(match.format || 'text')
    }
  }

  // Add custom column
  const handleAddCustomColumn = (e) => {
    e.preventDefault()
    if (!newColKey.trim() || !newColLabel.trim()) return

    const key = newColKey.trim().replace(/[^a-zA-Z0-9_]/g, '_')
    if (columns.some(c => (c.key || c.id) === key)) {
      setError(`Column with key "${key}" already exists.`)
      return
    }

    const newCol = {
      key,
      label: newColLabel.trim(),
      format: newColFormat,
      sortable: true,
      visible: true,
    }

    setColumns(prev => [...prev, newCol])
    setNewColKey('')
    setNewColLabel('')
    setSelectedAttrKey('')
    setIsCustomMode(false)
    setError('')
  }

  // Delete column
  const handleDeleteColumn = (key) => {
    setColumns(prev => prev.filter(c => (c.key || c.id) !== key))
  }

  // Save changes to database and metadataStore
  const handleSave = async () => {
    const visibleCols = columns.filter(c => c.visible !== false)
    if (visibleCols.length === 0) {
      setError('At least one column must be visible in the table.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const updatedSchema = {
        ...schema,
        columns: visibleCols,
        version: (schema.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      }

      // 1. Persist to SQL Server Database
      await saveSchemaToDb(schemaId, updatedSchema, tenantId)

      // 2. Persist to localStorage published key
      const publishedKey = `hrms_meta_${schemaId}_${tenantId}_published`
      localStorage.setItem(publishedKey, JSON.stringify(updatedSchema))

      // 3. Broadcast update across all open components
      window.dispatchEvent(
        new CustomEvent('hrms:metadata-updated', {
          detail: { schemaId, tenantOrCompanyId: tenantId, schema: updatedSchema },
        })
      )

      if (onSave) {
        await onSave(updatedSchema)
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 900)
    } catch (err) {
      setError(err?.message || 'Failed to save columns to database.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
              <Sliders size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Customize Table Columns
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  {schemaId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Choose visible columns, reorder 1, 2, 3 sequence, and save for all tenant users
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Column Header Preview Ribbon */}
        <div className="px-4 sm:px-5 py-2.5 bg-purple-50/40 border-b border-purple-100/70 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
            <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md mr-1">
              Table Preview:
            </span>
            {columns
              .filter(c => c.visible !== false)
              .map((c, idx) => (
                <React.Fragment key={c.key || c.id || idx}>
                  {idx > 0 && <span className="text-slate-300 font-bold">|</span>}
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-purple-200/70 shadow-2xs font-bold text-slate-800">
                    <span className="font-mono text-purple-700 text-[10px]">#{idx + 1}</span>
                    <span>{c.label}</span>
                  </span>
                </React.Fragment>
              ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-4 sm:mx-5 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Table columns updated and saved to database for all users!</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {/* Quick Add Preset Column Dropdown */}
          {availablePresets.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs">
                <span className="font-bold text-slate-800">Add Predefined Column:</span>
                <span className="text-[11px] text-slate-500 ml-1">Available standard attributes</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="">-- Choose column to add --</option>
                  {availablePresets.map(p => (
                    <option key={p.key} value={p.key}>
                      {p.label} ({p.key})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPreset}
                  disabled={!selectedPreset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 disabled:opacity-40 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Columns List */}
          <div className="space-y-2">
            {columns.map((col, idx) => {
              const colKey = col.key || col.id
              const isVisible = col.visible !== false
              return (
                <div
                  key={colKey || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border transition shadow-2xs ${
                    isVisible
                      ? 'border-slate-200 bg-white hover:border-purple-200'
                      : 'border-slate-200/60 bg-slate-100/70 opacity-60'
                  }`}
                >
                  {/* Sequence & Visibility */}
                  <div className="flex items-center gap-2.5">
                    {/* Toggle Visibility Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(colKey)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                        isVisible
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-200 text-slate-500'
                      }`}
                      title={isVisible ? 'Click to hide column' : 'Click to show column'}
                    >
                      {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    {/* Sequence Selector (1, 2, 3...) */}
                    <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2 py-1 rounded-xl shadow-2xs">
                      <Hash size={11} className="text-purple-600" />
                      <select
                        value={idx + 1}
                        onChange={(e) => handleJumpSequence(idx, Number(e.target.value))}
                        className="text-xs font-bold bg-transparent cursor-pointer outline-none font-mono"
                        title="Set sequence order number (1, 2, 3...)"
                      >
                        {columns.map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Format Badge */}
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {col.format || 'text'}
                    </span>
                  </div>

                  {/* Rename Column Label */}
                  <div className="flex-1 min-w-0">
                    <input
                      id={`col-label-${colKey}`}
                      name={`col_label_${colKey}`}
                      type="text"
                      value={col.label || ''}
                      onChange={(e) => handleRenameLabel(colKey, e.target.value)}
                      placeholder="Column Display Label"
                      className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:bg-white focus:border-purple-600 transition"
                    />
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 px-1">
                      Data key: {colKey}
                    </div>
                  </div>

                  {/* Format Selector & Controls */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <select
                      value={col.format || 'text'}
                      onChange={(e) => handleChangeFormat(colKey, e.target.value)}
                      className="text-[11px] font-semibold bg-white border border-slate-200 rounded-xl px-2 py-1.5 cursor-pointer outline-none focus:border-purple-600"
                    >
                      {COLUMN_FORMATS.map(f => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 transition shadow-2xs cursor-pointer"
                        title="Move Left in table"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === columns.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 transition shadow-2xs cursor-pointer"
                        title="Move Right in table"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(colKey)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-2xs cursor-pointer ml-1"
                        title="Remove Column"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Create Custom Column Accordion */}
          <details className="rounded-xl border border-dashed border-purple-300 p-3.5 bg-gradient-to-r from-purple-50/40 via-white to-slate-50/60 transition" open>
            <summary className="text-xs font-bold text-purple-700 cursor-pointer flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database size={14} className="text-purple-600" />
                <span>Add Data Column from Database Attributes</span>
              </span>
              <span className="text-[11px] font-semibold text-purple-500">Pick database field & customize</span>
            </summary>

            <form onSubmit={handleAddCustomColumn} className="space-y-3 pt-3">
              {/* Row 1: Database Attribute Dropdown Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers size={12} className="text-purple-600" />
                  Select Database Field (Auto-Populates Display Name & Cell Format)
                </label>
                <select
                  value={selectedAttrKey}
                  onChange={(e) => handleSelectAttribute(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="">-- Choose available database field to add column --</option>
                  {catalogGroups.map((grp) => (
                    <optgroup key={grp.category} label={`▼ ${grp.category}`}>
                      {grp.attributes.map((attr) => {
                        const isAlreadyAdded = columns.some(c => (c.key || c.id) === attr.key)
                        return (
                          <option key={attr.key} value={attr.key} disabled={isAlreadyAdded}>
                            {attr.label} (key: {attr.key}) {isAlreadyAdded ? '— [Already in table]' : `• Format: ${attr.format}`}
                          </option>
                        )
                      })}
                    </optgroup>
                  ))}
                  <optgroup label="Custom / Other Database Field">
                    <option value="__custom__">➕ Custom / Manual Database Attribute Key...</option>
                  </optgroup>
                </select>
              </div>

              {/* Row 2: Grid of Column Key, Display Label, Cell Format, and Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                {/* Column Key */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Database Column Key
                  </label>
                  {isCustomMode ? (
                    <input
                      id="custom-col-key-input"
                      name="customColKey"
                      type="text"
                      value={newColKey}
                      onChange={(e) => setNewColKey(e.target.value)}
                      placeholder="e.g. employee_branch"
                      className="w-full text-xs font-mono bg-purple-50/50 border border-purple-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-purple-900"
                    />
                  ) : (
                    <input
                      id="custom-col-key-disabled"
                      name="customColKeyDisabled"
                      type="text"
                      value={newColKey || 'Select above...'}
                      disabled
                      className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-600 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Display Label */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Display Header Label
                  </label>
                  <input
                    type="text"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    placeholder="e.g. Branch Station"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-purple-600 font-bold text-slate-900"
                  />
                </div>

                {/* Cell Format */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Cell Display Format
                  </label>
                  <select
                    value={newColFormat}
                    onChange={(e) => setNewColFormat(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2 py-1.5 outline-none focus:border-purple-600 cursor-pointer font-medium"
                  >
                    {COLUMN_FORMATS.map(f => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Button */}
                <div>
                  <button
                    type="submit"
                    disabled={!newColKey || !newColLabel}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold disabled:opacity-40 transition shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Column</span>
                  </button>
                </div>
              </div>

              {newColKey && newColLabel && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-purple-50/60 px-3 py-1.5 rounded-lg border border-purple-100">
                  <span>Preview: Adding <strong>{newColLabel}</strong> with key <code>{newColKey}</code> formatted as <strong>{COLUMN_FORMATS.find(f => f.value === newColFormat)?.label}</strong></span>
                  <span className="text-purple-700 font-semibold text-[10px]">Click &quot;Add Column&quot; to insert into list</span>
                </div>
              )}
            </form>
          </details>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Database size={13} className="text-purple-600" />
            <span className="hidden sm:inline">Persists to SQL Server for all tenant users</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const standard = (PRESET_COLUMNS[schemaId] || []).filter(c => !['mobile', 'email', 'joiningDate'].includes(c.key))
                if (standard.length > 0) {
                  setColumns(standard.map(c => ({ ...c, visible: true })))
                  setError('')
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer mr-1"
              title="Reset table to clean separate columns (Plan Layout)"
            >
              <RotateCcw size={13} />
              <span>Reset to Plan Layout</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Save size={14} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Saving...' : 'Save & Apply to Tenant'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
