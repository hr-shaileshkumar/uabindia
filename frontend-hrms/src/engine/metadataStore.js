/**
 * Uabindia HRMS Metadata Store & Versioning Engine
 * 
 * Provides:
 * - Default schemas for HRMS modules (Employee, Project, Company, Attendance, etc.)
 * - Dynamic overrides per tenant/company
 * - Publishing lifecycle: Draft -> Validate -> Preview -> Publish -> Version History -> Rollback
 * - Reactive update events: 'hrms:metadata-updated'
 */

import { validateMetadataSchema } from './types.js'

// Built-in standard schemas for core HRMS entities
export const DEFAULT_SCHEMAS = {
  // -------------------------------------------------------------
  // 1. EMPLOYEE DIRECTORY (TABLE SCHEMA)
  // -------------------------------------------------------------
  employee_directory: {
    id: 'employee_directory',
    entityType: 'employee',
    title: 'Employees',
    subtitle: 'Manage employee directory, departmental assignments, and organizational hierarchy',
    icon: 'Users',
    version: 1,
    tableConfig: {
      defaultSortKey: 'name',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50, 100],
      searchableKeys: ['code', 'name', 'companyName', 'projectName', 'department', 'designation', 'employmentType'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: true,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Staff', value: 'all' },
          { label: 'Active', value: 'Active' },
          { label: 'Draft', value: 'Draft' },
          { label: 'On Hold', value: 'Hold' },
        ],
        defaultValue: 'all',
      },
      {
        key: 'employmentType',
        label: 'Employment Type',
        type: 'select',
        options: [
          { label: 'All Types', value: 'all' },
          { label: 'Full Time', value: 'Full Time' },
          { label: 'Permanent Full-Time', value: 'Permanent Full-Time' },
          { label: 'Contract', value: 'Contract' },
          { label: 'Intern', value: 'Intern' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      {
        key: 'code',
        label: 'Employee ID',
        format: 'code',
        sortable: true,
        width: 'w-32',
      },
      {
        key: 'name',
        label: 'Employee Name',
        format: 'avatar',
        nameKey: 'name',
        sortable: true,
        width: 'w-48',
      },
      {
        key: 'designation',
        label: 'Role / Designation',
        format: 'text',
        primaryKey: 'designation',
        sortable: true,
        width: 'w-44',
      },
      {
        key: 'department',
        label: 'Department',
        format: 'text',
        primaryKey: 'department',
        sortable: true,
        width: 'w-36',
      },
      {
        key: 'companyName',
        label: 'Corporate Entity',
        format: 'text',
        primaryKey: 'companyName',
        sortable: true,
        width: 'w-44',
      },
      {
        key: 'projectName',
        label: 'Assigned Project',
        format: 'text',
        primaryKey: 'projectName',
        sortable: true,
        width: 'w-44',
      },
      {
        key: 'employmentType',
        label: 'Employment Type',
        format: 'badge',
        sortable: true,
        width: 'w-44',
      },
      {
        key: 'status',
        label: 'Status',
        format: 'badge',
        sortable: true,
        width: 'w-28',
      },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        width: 'w-28',
        actions: [
          { key: 'view', label: 'View Profile', icon: 'Eye', variant: 'outline', href: '/module/hrms/employee-master/view/:id' },
          { key: 'edit', label: 'Edit', icon: 'Edit3', variant: 'outline', href: '/module/hrms/employee-master/edit/:id' },
          { key: 'delete', label: 'Delete', icon: 'Trash2', variant: 'danger', requiresConfirm: true },
        ],
      },
    ],
    actions: [
      {
        key: 'create',
        label: 'Add Employee',
        icon: 'Plus',
        variant: 'primary',
        href: '/module/hrms/employee-master/create',
        permission: 'EmployeeMaster',
      },
    ],
  },

  // -------------------------------------------------------------
  // 2. EMPLOYEE PROFILE (PAGE & TABS SCHEMA)
  // -------------------------------------------------------------
  employee_profile: {
    id: 'employee_profile',
    entityType: 'employee',
    title: 'Employee Profile',
    icon: 'User',
    version: 1,
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'User', isDefault: true },
      { id: 'employment', label: 'Employment & Hierarchy', icon: 'Briefcase' },
      { id: 'customAttributes', label: 'Custom Attributes', icon: 'Sparkles' },
      { id: 'attendance', label: 'Attendance & FRS', icon: 'Clock', isRelated: true, relationKey: 'attendance' },
      { id: 'leave', label: 'Leave Wallet', icon: 'CalendarDays', isRelated: true, relationKey: 'leaves' },
      { id: 'payroll', label: 'Payroll & CTC', icon: 'CreditCard', restrictedRole: 'SuperAdmin' },
      { id: 'documents', label: 'Document Vault', icon: 'FileCheck2', isRelated: true, relationKey: 'documents' },
      { id: 'assets', label: 'Assets & IT', icon: 'Laptop' },
      { id: 'performance', label: 'Performance & Goals', icon: 'Award', isRelated: true, relationKey: 'performance' },
      { id: 'requests', label: 'Lifecycle & Requests', icon: 'History' },
      { id: 'audit', label: 'Audit Trail', icon: 'ShieldCheck', restrictedRole: 'SuperAdmin' },
    ],
    sections: {
      overview: [
        {
          id: 'sec_personal_bio',
          title: 'Personal Demographics & Bio',
          icon: 'User',
          columns: 2,
          fields: [
            { id: 'dob', label: 'Date of Birth', type: 'date', format: 'date' },
            { id: 'gender', label: 'Gender', type: 'text' },
            { id: 'maritalStatus', label: 'Marital Status', type: 'text' },
            { id: 'bloodGroup', label: 'Blood Group', type: 'badge', variant: 'rose' },
            { id: 'personalEmail', label: 'Personal Email', type: 'email' },
            { id: 'companyEmail', label: 'Company Email', type: 'email', highlight: true },
            { id: 'currentAddress', label: 'Current Residence Address', type: 'text', colSpan: 2 },
          ],
        },
        {
          id: 'sec_emergency_contact',
          title: 'Emergency Contact & Family Relations',
          icon: 'Phone',
          columns: 1,
          fields: [
            { id: 'emergencyContactName', label: 'Contact Person', type: 'text' },
            { id: 'emergencyRelation', label: 'Relationship', type: 'text' },
            { id: 'emergencyPhone', label: 'Emergency Phone', type: 'phone', highlight: true },
            { id: 'noticePeriodDays', label: 'Notice Period (Days)', type: 'number' },
            { id: 'attendanceDeviceId', label: 'Biometric / FRS Device ID', type: 'text' },
          ],
        },
      ],
      employment: [
        {
          id: 'sec_employment_info',
          title: 'Employment Classification & Corporate Hierarchy',
          icon: 'Briefcase',
          columns: 3,
          fields: [
            { id: 'companyName', label: 'Entity & Company', type: 'text', subtitleKey: 'companyCode' },
            { id: 'projectName', label: 'Field Project / Program', type: 'text' },
            { id: 'employmentType', label: 'Employment Type', type: 'text', badgeKey: 'grade' },
          ],
        },
        {
          id: 'sec_reporting_hierarchy',
          title: 'Approval & Reporting Hierarchy',
          icon: 'Users',
          columns: 3,
          fields: [
            { id: 'reportingManagerL1', label: 'Level 1 (Direct Lead)', type: 'text', subtext: 'Timesheets & Leave Approver' },
            { id: 'reportingManagerL2', label: 'Level 2 (Department Head)', type: 'text', subtext: 'Expeditions & TA/DA Review' },
            { id: 'reportingManagerL3', label: 'Level 3 (HR & Management)', type: 'text', subtext: 'Appraisals & Increments' },
          ],
        },
      ],
    },
    relations: [
      {
        id: 'attendance',
        tabId: 'attendance',
        entity: 'attendance',
        relationshipKey: 'employeeId',
        title: 'Attendance Logs & Face Recognition (FRS) Verification',
        icon: 'Clock',
        apiEndpoint: '/attendance',
        columns: [
          { key: 'attendanceDate', label: 'Date', format: 'date', sortable: true },
          { key: 'shiftName', label: 'Work Shift', format: 'text' },
          { key: 'punchInTime', label: 'Punch In (FRS)', format: 'text' },
          { key: 'punchOutTime', label: 'Punch Out', format: 'text' },
          { key: 'workHours', label: 'Hours Rendered', format: 'text' },
          { key: 'status', label: 'Status', format: 'badge' },
        ],
      },
      {
        id: 'leaves',
        tabId: 'leave',
        entity: 'leaves',
        relationshipKey: 'employeeId',
        title: 'Leave Applications & Balance Ledger',
        icon: 'CalendarDays',
        apiEndpoint: '/leaves/applications',
        columns: [
          { key: 'leaveType', label: 'Leave Category', format: 'text' },
          { key: 'startDate', label: 'From Date', format: 'date' },
          { key: 'endDate', label: 'To Date', format: 'date' },
          { key: 'days', label: 'Days', format: 'text' },
          { key: 'reason', label: 'Reason', format: 'text' },
          { key: 'status', label: 'Approval Status', format: 'badge' },
        ],
      },
      {
        id: 'payroll',
        tabId: 'payroll',
        entity: 'payroll',
        relationshipKey: 'employeeId',
        title: 'Monthly Salary Slips & Bank Advice Transfers',
        icon: 'CreditCard',
        restrictedRole: 'SuperAdmin',
        apiEndpoint: '/payroll/slips',
        columns: [
          { key: 'payrollMonth', label: 'Pay Period', format: 'text' },
          { key: 'grossEarnings', label: 'Gross Earnings', format: 'currency' },
          { key: 'statutoryDeductions', label: 'Deductions (PF/ESI)', format: 'currency' },
          { key: 'netPayable', label: 'Net Disbursed', format: 'currency' },
          { key: 'paymentStatus', label: 'Disbursement', format: 'badge' },
        ],
      },
      {
        id: 'documents',
        tabId: 'documents',
        entity: 'documents',
        relationshipKey: 'employeeId',
        title: 'Employee Compliance & Verification Vault',
        icon: 'FileCheck2',
        columns: [
          { key: 'documentType', label: 'Document Name', format: 'text' },
          { key: 'documentNumber', label: 'Doc Number / ID', format: 'text' },
          { key: 'issueDate', label: 'Issued Date', format: 'date' },
          { key: 'status', label: 'Verification Status', format: 'badge' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 3. EMPLOYEE FORM (CREATE & EDIT FORM SCHEMA)
  // -------------------------------------------------------------
  employee_form: {
    id: 'employee_form',
    entityType: 'employee',
    title: 'Employee Information',
    icon: 'UserCheck',
    version: 1,
    tabs: [
      { id: 'tab_identity', label: 'Identity & Bio', icon: 'User' },
      { id: 'tab_org', label: 'Organization & Structure', icon: 'Building2' },
      { id: 'tab_employment', label: 'Employment Details', icon: 'Briefcase' },
      { id: 'tab_contact', label: 'Contact & Addresses', icon: 'Phone' },
      { id: 'tab_statutory', label: 'Statutory & Payroll', icon: 'CreditCard' },
      { id: 'tab_bank', label: 'Bank Information', icon: 'Landmark' },
      { id: 'tab_education', label: 'Education & Academics', icon: 'GraduationCap' },
      { id: 'tab_experience', label: 'Previous Experience', icon: 'History' },
      { id: 'tab_custom', label: 'Custom Attributes', icon: 'Sparkles' },
    ],
    fields: [
      // Identity & Bio
      { id: 'employeeCode', tabId: 'tab_identity', label: 'Employee Code', type: 'text', required: true, width: '1/3', placeholder: 'Auto-generated or CMP-PRJ-0001' },
      { id: 'salutation', tabId: 'tab_identity', label: 'Salutation', type: 'select', options: ['Mr.', 'Mrs.', 'Ms.', 'Dr.'], width: '1/3' },
      { id: 'firstName', tabId: 'tab_identity', label: 'First Name', type: 'text', required: true, width: '1/3', placeholder: 'e.g. Ramesh' },
      { id: 'middleName', tabId: 'tab_identity', label: 'Middle Name', type: 'text', width: '1/3' },
      { id: 'lastName', tabId: 'tab_identity', label: 'Last Name', type: 'text', required: true, width: '1/3', placeholder: 'e.g. Kumar' },
      { id: 'gender', tabId: 'tab_identity', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'], width: '1/3' },
      { id: 'dob', tabId: 'tab_identity', label: 'Date of Birth', type: 'date', width: '1/3' },
      { id: 'maritalStatus', tabId: 'tab_identity', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'], width: '1/3' },
      { id: 'bloodGroup', tabId: 'tab_identity', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], width: '1/3' },
      { id: 'status', tabId: 'tab_identity', label: 'Employee Status', type: 'select', required: true, options: ['Active', 'Draft', 'Hold', 'Exited'], defaultValue: 'Active', width: '1/3' },

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
      { id: 'employmentType', tabId: 'tab_employment', label: 'Employment Type', type: 'select', required: true, options: ['Full Time', 'Permanent Full-Time', 'Contract', 'Intern', 'Part Time'], width: '1/3' },
      { id: 'grade', tabId: 'tab_employment', label: 'Grade / Cadre', type: 'text', width: '1/3', placeholder: 'e.g. M3, L2' },
      { id: 'offerDate', tabId: 'tab_employment', label: 'Offer Date', type: 'date', width: '1/3' },
      { id: 'joiningDate', tabId: 'tab_employment', label: 'Joining Date', type: 'date', required: true, width: '1/3' },
      { id: 'confirmationDate', tabId: 'tab_employment', label: 'Confirmation Date', type: 'date', width: '1/3' },
      { id: 'noticePeriodDays', tabId: 'tab_employment', label: 'Notice Period (Days)', type: 'number', width: '1/3', defaultValue: 30 },
      { id: 'attendanceDeviceId', tabId: 'tab_employment', label: 'FRS / Biometric Machine ID', type: 'text', width: '1/2', placeholder: 'e.g. FR-PAT-09' },
      { id: 'punchId', tabId: 'tab_employment', label: 'Punch / Card ID', type: 'text', width: '1/2' },

      // Contact & Addresses
      { id: 'mobile', tabId: 'tab_contact', label: 'Primary Mobile Number', type: 'phone', required: true, width: '1/2', placeholder: '10-digit number' },
      { id: 'alternateMobile', tabId: 'tab_contact', label: 'Alternate Mobile', type: 'phone', width: '1/2' },
      { id: 'personalEmail', tabId: 'tab_contact', label: 'Personal Email Address', type: 'email', width: '1/2', placeholder: 'user@gmail.com' },
      { id: 'companyEmail', tabId: 'tab_contact', label: 'Official Corporate Email', type: 'email', width: '1/2', placeholder: 'user@company.com' },
      { id: 'currentAddress', tabId: 'tab_contact', label: 'Current Residential Address', type: 'textarea', width: 'full' },
      { id: 'permanentAddress', tabId: 'tab_contact', label: 'Permanent Domicile Address', type: 'textarea', width: 'full' },
      { id: 'emergencyContactName', tabId: 'tab_contact', label: 'Emergency Contact Person', type: 'text', width: '1/3' },
      { id: 'emergencyRelation', tabId: 'tab_contact', label: 'Emergency Relationship', type: 'text', width: '1/3' },
      { id: 'emergencyPhone', tabId: 'tab_contact', label: 'Emergency Phone Number', type: 'phone', width: '1/3' },

      // Statutory & Payroll
      { id: 'panNumber', tabId: 'tab_statutory', label: 'PAN Card Number', type: 'text', width: '1/2', placeholder: 'ABCDE1234F' },
      { id: 'aadhaarNumber', tabId: 'tab_statutory', label: 'Aadhaar Number', type: 'text', width: '1/2', placeholder: '12-digit UID' },
      { id: 'uanNumber', tabId: 'tab_statutory', label: 'UAN Number (EPFO)', type: 'text', width: '1/2' },
      { id: 'pfAccountNumber', tabId: 'tab_statutory', label: 'PF Account Number', type: 'text', width: '1/2' },
      { id: 'esiNumber', tabId: 'tab_statutory', label: 'ESIC Insurance Number', type: 'text', width: '1/2' },
      { id: 'ctc', tabId: 'tab_statutory', label: 'Annual Cost to Company (CTC)', type: 'currency', width: '1/2', placeholder: 'e.g. 600000' },

      // Bank Information
      { id: 'bankName', tabId: 'tab_bank', label: 'Bank Name', type: 'text', width: '1/2', placeholder: 'e.g. State Bank of India' },
      { id: 'accountHolderName', tabId: 'tab_bank', label: 'Beneficiary / Account Holder Name', type: 'text', width: '1/2' },
      { id: 'accountNumber', tabId: 'tab_bank', label: 'Bank Account Number', type: 'text', width: '1/2' },
      { id: 'ifscCode', tabId: 'tab_bank', label: 'IFSC Code', type: 'text', width: '1/2', placeholder: 'e.g. SBIN0001234' },
      { id: 'bankBranchName', tabId: 'tab_bank', label: 'Bank Branch Name', type: 'text', width: 'full' },

      // Education
      { id: 'qualification', tabId: 'tab_education', label: 'Highest Degree / Qualification', type: 'text', width: '1/2', placeholder: 'e.g. B.Tech / MBA' },
      { id: 'institution', tabId: 'tab_education', label: 'University / Institution', type: 'text', width: '1/2' },
      { id: 'yearOfPassing', tabId: 'tab_education', label: 'Year of Passing', type: 'number', width: '1/2' },
      { id: 'percentage', tabId: 'tab_education', label: 'Marks / Percentage / CGPA', type: 'text', width: '1/2' },

      // Previous Experience
      { id: 'previousCompanyName', tabId: 'tab_experience', label: 'Previous Employer', type: 'text', width: '1/2' },
      { id: 'previousDesignation', tabId: 'tab_experience', label: 'Previous Role / Designation', type: 'text', width: '1/2' },
      { id: 'previousSalary', tabId: 'tab_experience', label: 'Last Drawn CTC', type: 'currency', width: '1/2' },
      { id: 'reasonForLeaving', tabId: 'tab_experience', label: 'Reason for Leaving', type: 'text', width: '1/2' },

      // Custom Attributes
      { id: 'specialMedicalNotes', tabId: 'tab_custom', label: 'Special Medical Notes', type: 'textarea', width: 'full' },
      { id: 'covidVaccinated', tabId: 'tab_custom', label: 'Vaccination Completed', type: 'boolean', width: '1/2' },
    ],
  },

  // -------------------------------------------------------------
  // 4. PROJECTS DIRECTORY (TABLE SCHEMA)
  // -------------------------------------------------------------
  project_directory: {
    id: 'project_directory',
    entityType: 'project',
    title: 'Projects & Program Allocations',
    subtitle: 'Track field programs, budgets, and team workforce deployment',
    icon: 'FolderKanban',
    version: 1,
    tableConfig: {
      defaultSortKey: 'projectName',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['projectName', 'projectCode', 'clientName', 'companyName', 'billingType', 'status'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Projects', value: 'all' },
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'projectCode', label: 'Project Code', format: 'code', sortable: true, width: 'w-32' },
      { key: 'projectName', label: 'Project Name', format: 'text', sortable: true, width: 'w-52' },
      { key: 'clientName', label: 'Client / Stakeholder', format: 'text', sortable: true, width: 'w-44' },
      { key: 'companyName', label: 'Corporate Entity', format: 'text', sortable: true, width: 'w-44' },
      { key: 'startDate', label: 'Start Date', format: 'date', sortable: true, width: 'w-32' },
      { key: 'endDate', label: 'Target Completion', format: 'date', sortable: true, width: 'w-32' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'view', label: 'View Project', icon: 'Eye', variant: 'outline', href: '/module/hrms/projects/view/:id' },
          { key: 'edit', label: 'Edit', icon: 'Edit3', variant: 'outline', href: '/module/hrms/projects/edit/:id' },
          { key: 'toggleStatus', label: 'Toggle Status', icon: 'Power', variant: 'outline' },
        ],
      },
    ],
    actions: [
      {
        key: 'create',
        label: 'Add Project',
        icon: 'Plus',
        variant: 'primary',
        href: '/module/hrms/projects/create',
        permission: 'Projects',
      },
    ],
  },

  // -------------------------------------------------------------
  // 5. COMPANIES DIRECTORY (TABLE SCHEMA)
  // -------------------------------------------------------------
  company_directory: {
    id: 'company_directory',
    entityType: 'company',
    title: 'Companies & Corporate Entities',
    subtitle: 'Manage legal entities, GSTIN, PAN, and corporate registrations',
    icon: 'Building2',
    version: 1,
    tableConfig: {
      defaultSortKey: 'companyName',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['companyName', 'companyCode', 'tenantName', 'cin', 'panNumber', 'contactPerson', 'city'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Companies', value: 'all' },
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'companyCode', label: 'Company Code', format: 'code', sortable: true, width: 'w-32' },
      { key: 'companyName', label: 'Company Name', format: 'text', sortable: true, width: 'w-56' },
      { key: 'tenantName', label: 'Tenant / Group', format: 'text', sortable: true, width: 'w-44' },
      { key: 'contactPerson', label: 'Key Contact', format: 'text', sortable: true, width: 'w-40' },
      { key: 'city', label: 'Location / City', format: 'text', sortable: true, width: 'w-36' },
      { key: 'panNumber', label: 'Tax ID / PAN', format: 'text', sortable: true, width: 'w-36' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'view', label: 'View Entity', icon: 'Eye', variant: 'outline', href: '/module/hrms/company-master/view/:id' },
          { key: 'setup', label: 'Setup', icon: 'Settings2', variant: 'outline', href: '/module/hrms/company-master/view/:id?tab=setup' },
          { key: 'edit', label: 'Edit', icon: 'Edit3', variant: 'outline', href: '/module/hrms/company-master/edit/:id' },
          { key: 'toggleStatus', label: 'Toggle Status', icon: 'Power', variant: 'outline' },
          { key: 'delete', label: 'Delete', icon: 'Trash2', variant: 'danger', requiresConfirm: true },
        ],
      },
    ],
    actions: [
      {
        key: 'create',
        label: 'Add Company',
        icon: 'Plus',
        variant: 'primary',
        href: '/module/hrms/company-master/create',
        permission: 'Companies',
      },
    ],
  },

  // -------------------------------------------------------------
  // 5. TENANT DIRECTORY (TABLE SCHEMA FOR SAAS SUPERADMIN)
  // -------------------------------------------------------------
  tenant_directory: {
    id: 'tenant_directory',
    entityType: 'tenant',
    title: 'Tenant Accounts & SaaS Subscriptions',
    subtitle: 'Manage client enterprise organizations, subdomains, data isolation models, and SaaS tiers',
    icon: 'ShieldCheck',
    version: 1,
    tableConfig: {
      defaultSortKey: 'companyName',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['companyName', 'subdomain', 'contactEmail', 'planName'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Tenants', value: 'all' },
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'companyName', label: 'Tenant Legal Name', format: 'text', sortable: true, width: 'w-56' },
      { key: 'subdomain', label: 'Subdomain Routing', format: 'code', sortable: true, width: 'w-36' },
      { key: 'plan', label: 'Subscription Plan', format: 'badge', sortable: true, width: 'w-36' },
      { key: 'isolationModel', label: 'Data Isolation', format: 'text', sortable: true, width: 'w-36' },
      { key: 'contactEmail', label: 'Primary Contact', format: 'text', sortable: true, width: 'w-48' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'view', label: 'View Profile', icon: 'Eye', variant: 'outline', href: '/tenant-master/view/:id' },
          { key: 'edit', label: 'Edit Tier', icon: 'Edit3', variant: 'outline', href: '/tenant-master/edit/:id' },
          { key: 'delete', label: 'Delete', icon: 'Trash2', variant: 'danger', requiresConfirm: true },
        ],
      },
    ],
    actions: [
      {
        key: 'create',
        label: 'Add Tenant',
        icon: 'Plus',
        variant: 'primary',
        href: '/tenant-master/create',
        permission: 'superadmin',
      },
    ],
  },

  // -------------------------------------------------------------
  // 6. LEAVE MANAGEMENT (TABLE SCHEMA)
  // -------------------------------------------------------------
  leave_directory: {
    id: 'leave_directory',
    entityType: 'leave',
    title: 'Leave Applications',
    subtitle: 'Review departmental leave balances, absence requests, and managerial approvals',
    icon: 'CalendarDays',
    version: 1,
    tableConfig: {
      defaultSortKey: 'employee',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['employeeName', 'employeeCode', 'leaveTypeName', 'reason', 'status'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Requests', value: 'all' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'employee', label: 'Employee', format: 'avatar', nameKey: 'employeeName', sortable: true, width: 'w-52' },
      { key: 'leaveType', label: 'Leave Type', format: 'badge', sortable: true, width: 'w-36' },
      { key: 'duration', label: 'Duration Dates', format: 'text', sortable: true, width: 'w-44' },
      { key: 'days', label: 'Days', format: 'text', sortable: true, width: 'w-24' },
      { key: 'reason', label: 'Reason', format: 'text', sortable: true, width: 'w-48' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'approve', label: 'Approve', icon: 'Check', variant: 'outline' },
          { key: 'reject', label: 'Reject', icon: 'X', variant: 'danger' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 7. PAYROLL MANAGEMENT (TABLE SCHEMA)
  // -------------------------------------------------------------
  payroll_directory: {
    id: 'payroll_directory',
    entityType: 'payroll',
    title: 'Payroll & Disbursal Registry',
    subtitle: 'Gross-to-net salary computation, statutory EPF/ESIC deductions, and banking transfers',
    icon: 'Banknote',
    version: 1,
    tableConfig: {
      defaultSortKey: 'employee',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['employeeName', 'employeeCode', 'designationName'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    columns: [
      { key: 'employee', label: 'Employee', format: 'avatar', nameKey: 'employeeName', sortable: true, width: 'w-52' },
      { key: 'basicPay', label: 'Basic Pay', format: 'currency', sortable: true, width: 'w-36' },
      { key: 'grossPay', label: 'Gross Pay', format: 'currency', sortable: true, width: 'w-36' },
      { key: 'pfEmployee', label: 'EPF (12%)', format: 'currency', sortable: true, width: 'w-32' },
      { key: 'esicEmployee', label: 'ESIC', format: 'currency', sortable: true, width: 'w-32' },
      { key: 'netPay', label: 'Net Salary', format: 'currency', sortable: true, width: 'w-36' },
      {
        key: 'actions',
        label: 'View Breakdown',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'breakdown', label: 'Breakdown', icon: 'Eye', variant: 'outline' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 8. PERFORMANCE APPRAISALS (TABLE SCHEMA)
  // -------------------------------------------------------------
  performance_directory: {
    id: 'performance_directory',
    entityType: 'performance',
    title: 'Performance Appraisals & Score Commitments',
    subtitle: 'Employee evaluation records, KPI goals, ratings breakdown, and committee approvals',
    icon: 'Award',
    version: 1,
    tableConfig: {
      defaultSortKey: 'employee',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['employeeName', 'employeeCode', 'departmentName'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Reviews', value: 'all' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Pending', value: 'Pending' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'employee', label: 'Employee', format: 'avatar', nameKey: 'employeeName', sortable: true, width: 'w-52' },
      { key: 'department', label: 'Department', format: 'text', sortable: true, width: 'w-40' },
      { key: 'selfRating', label: 'Self Rating', format: 'text', sortable: true, width: 'w-32' },
      { key: 'managerRating', label: 'Manager Rating', format: 'text', sortable: true, width: 'w-32' },
      { key: 'finalScore', label: 'Final Score', format: 'text', sortable: true, width: 'w-32' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'selfReview', label: 'Self Review', icon: 'Edit3', variant: 'outline' },
          { key: 'managerReview', label: 'Manager Review', icon: 'UserCheck', variant: 'outline' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 9. STATUTORY COMPLIANCE (TABLE SCHEMA)
  // -------------------------------------------------------------
  compliance_directory: {
    id: 'compliance_directory',
    entityType: 'compliance',
    title: 'Statutory Filings & Deposit Archive',
    subtitle: 'Government challan receipts, TRRN logs, EPFO ECR records, and ESIC compliance proofs',
    icon: 'ShieldCheck',
    version: 1,
    tableConfig: {
      defaultSortKey: 'statutoryType',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['statutoryType', 'challanNumber', 'filingStatus'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'statutoryType',
        label: 'Category',
        type: 'select',
        options: [
          { label: 'All Filing Categories', value: 'all' },
          { label: 'Provident Fund (EPF)', value: 'PF_ECR' },
          { label: 'ESIC Contributions', value: 'ESIC' },
          { label: 'Professional Tax (PT)', value: 'PT' },
          { label: 'TDS Withholding', value: 'TDS' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'statutoryType', label: 'Statutory Category', format: 'badge', sortable: true, width: 'w-40' },
      { key: 'period', label: 'Pay Period', format: 'text', sortable: true, width: 'w-36' },
      { key: 'challanNumber', label: 'Challan / TRRN Receipt', format: 'code', sortable: true, width: 'w-44' },
      { key: 'totalEmployeesCovered', label: 'Headcount', format: 'text', sortable: true, width: 'w-32' },
      { key: 'totalAmountPaid', label: 'Deposit Amount', format: 'currency', sortable: true, width: 'w-36' },
      { key: 'filingStatus', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      { key: 'filingDate', label: 'Payment Date', format: 'date', align: 'right', width: 'w-32' },
    ],
  },

  // -------------------------------------------------------------
  // 10. EXIT MANAGEMENT (TABLE SCHEMA)
  // -------------------------------------------------------------
  exit_directory: {
    id: 'exit_directory',
    entityType: 'exit',
    title: 'Separation Registry & Exit Cases',
    subtitle: 'Employee resignation workflows, notice period compliance, no-dues clearances, and FnF settlements',
    icon: 'LogOut',
    version: 1,
    tableConfig: {
      defaultSortKey: 'employee',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['employeeName', 'employeeCode', 'departmentName', 'status'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Submitted', value: 'Submitted' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Relieved', value: 'Relieved' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'employee', label: 'Employee', format: 'avatar', nameKey: 'employeeName', sortable: true, width: 'w-52' },
      { key: 'department', label: 'Department', format: 'text', sortable: true, width: 'w-40' },
      { key: 'resignationDate', label: 'Resignation Date', format: 'date', sortable: true, width: 'w-36' },
      { key: 'noticePeriodDays', label: 'Notice Period', format: 'text', sortable: true, width: 'w-32' },
      { key: 'requestedRelievingDate', label: 'Target Relieving', format: 'date', sortable: true, width: 'w-36' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'approve', label: 'Approve', icon: 'Check', variant: 'outline' },
          { key: 'clearances', label: 'Clearances', icon: 'FileCheck2', variant: 'outline' },
          { key: 'settlement', label: 'FnF Settlement', icon: 'DollarSign', variant: 'outline' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 11. USER DIRECTORY (TABLE SCHEMA)
  // -------------------------------------------------------------
  user_directory: {
    id: 'user_directory',
    entityType: 'user',
    title: 'User Accounts & Access',
    subtitle: 'System authentication profiles, administrative role tiers, and company permissions',
    icon: 'ShieldCheck',
    version: 1,
    tableConfig: {
      defaultSortKey: 'user',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['fullName', 'userName', 'mobileNumber', 'companyName', 'roleName'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'segmented',
        options: [
          { label: 'All Users', value: 'all' },
          { label: 'Active Only', value: 'Active' },
          { label: 'Inactive Only', value: 'Suspended' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'user', label: 'User Identity', format: 'avatar', nameKey: 'fullName', sortable: true, width: 'w-52' },
      { key: 'mobile', label: 'Mobile Contact', format: 'text', sortable: true, width: 'w-36' },
      { key: 'role', label: 'Role Tier', format: 'badge', sortable: true, width: 'w-40' },
      { key: 'company', label: 'Assigned Company', format: 'text', sortable: true, width: 'w-48' },
      { key: 'status', label: 'Status', format: 'badge', sortable: true, width: 'w-28' },
      { key: 'createdAt', label: 'Created Date', format: 'date', sortable: true, width: 'w-32' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        actions: [
          { key: 'resetPassword', label: 'Reset Password', icon: 'KeyRound', variant: 'outline' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // 12. CANDIDATE PIPELINE & ATS (TABLE SCHEMA)
  // -------------------------------------------------------------
  candidate_pipeline: {
    id: 'candidate_pipeline',
    entityType: 'candidate',
    title: 'Candidate Pipeline & ATS Tracking',
    subtitle: 'Applicant tracking system, candidate interview stages, ratings, and hiring workflow',
    icon: 'Users',
    version: 1,
    tableConfig: {
      defaultSortKey: 'fullName',
      defaultSortDir: 'asc',
      pageSize: 15,
      pageSizeOptions: [10, 15, 25, 50],
      searchableKeys: ['candidateCode', 'fullName', 'jobTitle', 'department', 'email', 'phone'],
      showExport: true,
      exportFormats: ['csv', 'json'],
      bulkSelection: false,
    },
    filters: [
      {
        key: 'stage',
        label: 'Pipeline Stage',
        type: 'segmented',
        options: [
          { label: 'All Stages', value: 'all' },
          { label: 'Applied', value: 'Applied' },
          { label: 'Screening', value: 'Screening' },
          { label: 'Interview', value: 'Interview Scheduled' },
          { label: 'Ready to Onboard', value: 'Ready to Onboard' },
          { label: 'Hired', value: 'Hired' },
        ],
        defaultValue: 'all',
      },
    ],
    columns: [
      { key: 'candidateCode', label: 'Candidate Code', format: 'code', sortable: true, width: 'w-32' },
      { key: 'fullName', label: 'Candidate Name', format: 'avatar', sortable: true, width: 'w-52' },
      { key: 'jobTitle', label: 'Role Requisition', format: 'text', sortable: true, width: 'w-48' },
      { key: 'contact', label: 'Contact', format: 'text', width: 'w-44' },
      { key: 'totalExperienceYears', label: 'Experience', format: 'text', width: 'w-28' },
      { key: 'expectedCtc', label: 'Expected CTC', format: 'text', width: 'w-32' },
      { key: 'rating', label: 'Rating', format: 'text', align: 'center', width: 'w-28' },
      { key: 'currentStage', label: 'Pipeline Stage', format: 'badge', align: 'center', width: 'w-36' },
      {
        key: 'actions',
        label: 'Actions',
        format: 'actions',
        align: 'right',
        width: 'w-28',
        actions: [
          { key: 'view', label: 'View Candidate', icon: 'Eye', variant: 'outline' },
          { key: 'edit', label: 'Edit Stage', icon: 'Edit3', variant: 'outline' },
        ],
      },
    ],
  },
}

const STORAGE_PREFIX = 'hrms_meta_'
const _lastSyncTime = new Map()

// Lazy reference to schema API
let _schemaApi = null
async function getSchemaApi() {
  if (!_schemaApi && typeof window !== 'undefined') {
    try {
      _schemaApi = await import('../api/schemas.js')
    } catch {
      _schemaApi = null
    }
  }
  return _schemaApi
}

/**
 * Fetch and synchronize schema from SQL Server backend
 */
export async function syncSchemaFromDb(schemaId, tenantOrCompanyId = 'default', force = false) {
  if (typeof window === 'undefined') return null
  const cacheKey = `${schemaId}_${tenantOrCompanyId}`
  const now = Date.now()
  const lastSync = _lastSyncTime.get(cacheKey) || 0
  if (!force && now - lastSync < 5000) return null
  _lastSyncTime.set(cacheKey, now)

  try {
    const api = await getSchemaApi()
    if (!api?.fetchSchemaFromDb) return null

    const dbSchema = await api.fetchSchemaFromDb(schemaId, tenantOrCompanyId)
    if (dbSchema) {
      const defaultSchema = DEFAULT_SCHEMAS[schemaId]
      const isLegacy = Array.isArray(dbSchema.columns) && (
        dbSchema.columns.some(c => c.key === 'role' && c.secondaryKey === 'department') ||
        dbSchema.columns.some(c => c.key === 'company' && c.secondaryKey === 'projectName') ||
        (dbSchema.columns.some(c => c.key === 'code') && dbSchema.columns.some(c => c.key === 'employee')) ||
        (defaultSchema && (defaultSchema.version || 0) > (dbSchema.version || 0))
      )

      if (defaultSchema && isLegacy) {
        dbSchema.columns = defaultSchema.columns
        dbSchema.version = defaultSchema.version
        if (api?.saveSchemaToDb) {
          api.saveSchemaToDb(schemaId, dbSchema, tenantOrCompanyId).catch(() => {})
        }
      } else if (Array.isArray(dbSchema.columns) && dbSchema.columns.length === 0 && defaultSchema?.columns?.length > 0) {
        dbSchema.columns = defaultSchema.columns
      }
      if (Array.isArray(dbSchema.columns)) {
        dbSchema.columns = dbSchema.columns.map(c => {
          const copy = { ...c }
          if (copy.subKey === 'code' || copy.subKey === 'employeeCode') copy.subKey = 'none'
          return copy
        })
      }
    }

    const publishedKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_published`
    const local = localStorage.getItem(publishedKey)
    let localParsed = null
    try {
      const p = local ? JSON.parse(local) : null
      localParsed = (p && typeof p === 'object') ? p : null
    } catch {
      localParsed = null
    }

    // Determine if DB schema has changes or new columns/fields
    const hasDiff = !localParsed ||
      (dbSchema.version && dbSchema.version > (localParsed.version || 0)) ||
      (dbSchema.updatedAt && dbSchema.updatedAt !== localParsed.updatedAt) ||
      (JSON.stringify(dbSchema.columns || dbSchema.fields) !== JSON.stringify(localParsed.columns || localParsed.fields))

    if (hasDiff) {
      localStorage.setItem(publishedKey, JSON.stringify(dbSchema))
      window.dispatchEvent(
        new CustomEvent('hrms:metadata-updated', {
          detail: { schemaId, tenantOrCompanyId, schema: dbSchema },
        })
      )
      return dbSchema
    }
  } catch (err) {
    console.warn(`[syncSchemaFromDb] Could not sync ${schemaId}:`, err)
  }
  return null
}

/**
 * Get active published metadata schema
 */
export function getMetadataSchema(schemaId, tenantOrCompanyId = 'default') {
  // Trigger background sync from database if in browser
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      syncSchemaFromDb(schemaId, tenantOrCompanyId)
    }, 10)
  }

  try {
    const publishedKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_published`
    const stored = localStorage.getItem(publishedKey)
    if (stored) {
      let parsed = null
      try {
        const p = JSON.parse(stored)
        parsed = (p && typeof p === 'object') ? p : null
      } catch {
        parsed = null
      }

      if (parsed) {
        const defaultSchema = DEFAULT_SCHEMAS[schemaId]
        // Auto-upgrade legacy schema if it has compound columns or version is older
        const hasLegacyCompoundColumns = Array.isArray(parsed.columns) && (
          parsed.columns.some(c => c.key === 'role' && c.secondaryKey === 'department') ||
          parsed.columns.some(c => c.key === 'company' && c.secondaryKey === 'projectName') ||
          (parsed.columns.some(c => c.key === 'code') && parsed.columns.some(c => c.key === 'employee'))
        )
        const isOutdatedVersion = defaultSchema && (defaultSchema.version || 0) > (parsed.version || 0)

        if (defaultSchema && (hasLegacyCompoundColumns || isOutdatedVersion)) {
          localStorage.setItem(publishedKey, JSON.stringify(defaultSchema))
          return defaultSchema
        }

        if (Array.isArray(parsed.columns) && parsed.columns.length === 0 && defaultSchema?.columns?.length > 0) {
          parsed.columns = defaultSchema.columns
        }
        if (parsed.title && /dossier/i.test(parsed.title)) {
          parsed.title = parsed.title.replace(/Employee Master Dossier Form/i, 'Employee Information').replace(/Employee Master Dossier/i, 'Employee Profile').replace(/Dossier/gi, 'Profile')
        }
        if (Array.isArray(parsed.columns)) {
          parsed.columns = parsed.columns.map(c => {
            const copy = { ...c }
            if (copy.subKey === 'code') copy.subKey = 'none'
            if (copy.key === 'role' && copy.secondaryKey === 'department') {
              delete copy.secondaryKey
              copy.label = 'Role / Designation'
            }
            if (copy.key === 'company' && copy.secondaryKey === 'projectName') {
              delete copy.secondaryKey
              copy.label = 'Corporate Entity'
            }
            if (copy.label && /dossier/i.test(copy.label)) {
              copy.label = copy.label.replace(/Employee Dossier/i, 'Employee').replace(/Dossier/gi, 'Profile')
            }
            return copy
          })
        }
        return parsed
      } else {
        localStorage.removeItem(publishedKey)
      }
    }
  } catch (err) {
    console.warn('Could not read published schema from storage:', err)
  }

  // Fallback to system default
  return DEFAULT_SCHEMAS[schemaId] || null
}

/**
 * Get draft metadata schema (for FormStudio / preview)
 */
export function getDraftSchema(schemaId, tenantOrCompanyId = 'default') {
  try {
    const draftKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_draft`
    const stored = localStorage.getItem(draftKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}

  return getMetadataSchema(schemaId, tenantOrCompanyId)
}

/**
 * Save draft schema
 */
export function saveDraftSchema(schemaId, schema, tenantOrCompanyId = 'default') {
  const validation = validateMetadataSchema(schema)
  const draftKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_draft`
  try {
    localStorage.setItem(draftKey, JSON.stringify(schema))
    window.dispatchEvent(
      new CustomEvent('hrms:metadata-draft-updated', {
        detail: { schemaId, tenantOrCompanyId, schema },
      })
    )
  } catch (err) {
    console.error('Failed to save draft schema:', err)
  }
  return validation
}

/**
 * Publish schema: moves draft to published, creates version entry, and syncs to SQL Server
 */
export async function publishSchema(schemaId, tenantOrCompanyId = 'default') {
  const draft = getDraftSchema(schemaId, tenantOrCompanyId)
  if (!draft) return { success: false, errors: ['No schema found to publish.'] }

  const validation = validateMetadataSchema(draft)
  if (!validation.isValid) {
    return { success: false, errors: validation.errors }
  }

  const publishedKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_published`
  const historyKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_history`

  try {
    // Current published becomes version history
    const current = getMetadataSchema(schemaId, tenantOrCompanyId)
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')

    const baseVersion = parseFloat(draft.version || current?.version || 1.0)
    const newVersion = parseFloat((baseVersion + 0.01).toFixed(2))
    const publishedSchema = {
      ...draft,
      version: newVersion,
      publishedAt: new Date().toISOString(),
    }

    if (current) {
      history.unshift({
        ...current,
        archivedAt: new Date().toISOString(),
      })
      // Keep up to 10 versions
      if (history.length > 10) history.pop()
      localStorage.setItem(historyKey, JSON.stringify(history))
    }

    localStorage.setItem(publishedKey, JSON.stringify(publishedSchema))

    // Persist to SQL Server Database synchronously for all users
    if (typeof window !== 'undefined') {
      try {
        const api = await getSchemaApi()
        if (api?.saveSchemaToDb) {
          await api.saveSchemaToDb(schemaId, publishedSchema, tenantOrCompanyId)
        }
      } catch (dbErr) {
        console.warn('[publishSchema] Database sync warning:', dbErr)
      }

      // Broadcast publish event across application
      window.dispatchEvent(
        new CustomEvent('hrms:metadata-updated', {
          detail: { schemaId, tenantOrCompanyId, schema: publishedSchema },
        })
      )
    }

    return { success: true, schema: publishedSchema }
  } catch (err) {
    console.error('Failed to publish schema:', err)
    return { success: false, errors: [err.message] }
  }
}

/**
 * Get schema version history
 */
export function getVersionHistory(schemaId, tenantOrCompanyId = 'default') {
  try {
    const historyKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_history`
    return JSON.parse(localStorage.getItem(historyKey) || '[]')
  } catch {
    return []
  }
}

/**
 * Rollback schema to a prior version
 */
export function rollbackSchema(schemaId, versionNumber, tenantOrCompanyId = 'default') {
  const history = getVersionHistory(schemaId, tenantOrCompanyId)
  const target = history.find(v => v.version === versionNumber)
  if (!target) return { success: false, message: 'Target version not found.' }

  const publishedKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_published`
  try {
    localStorage.setItem(publishedKey, JSON.stringify(target))
    window.dispatchEvent(
      new CustomEvent('hrms:metadata-updated', {
        detail: { schemaId, tenantOrCompanyId, schema: target },
      })
    )
    return { success: true, schema: target }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

/**
 * Reset schema to factory system default
 */
export function resetMetadataSchema(schemaId, tenantOrCompanyId = 'default') {
  const defaultSchema = DEFAULT_SCHEMAS[schemaId]
  if (!defaultSchema) return false

  const publishedKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_published`
  const draftKey = `${STORAGE_PREFIX}${schemaId}_${tenantOrCompanyId}_draft`

  localStorage.removeItem(publishedKey)
  localStorage.removeItem(draftKey)

  window.dispatchEvent(
    new CustomEvent('hrms:metadata-updated', {
      detail: { schemaId, tenantOrCompanyId, schema: defaultSchema },
    })
  )
  return true
}

export default {
  DEFAULT_SCHEMAS,
  getMetadataSchema,
  getDraftSchema,
  saveDraftSchema,
  publishSchema,
  getVersionHistory,
  rollbackSchema,
  resetMetadataSchema,
}
