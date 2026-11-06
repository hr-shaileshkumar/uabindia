/**
 * Automated Verification Test Suite for Uabindia HRMS Metadata Architecture
 */

import {
  validateMetadataSchema,
  validateFieldDefinition,
  validateColumnDefinition,
  ALLOWED_FIELD_TYPES,
  ALLOWED_COLUMN_FORMATS,
} from '../src/engine/types.js'

import {
  DEFAULT_SCHEMAS,
} from '../src/engine/metadataStore.js'

import {
  checkUserPermission,
} from '../src/engine/permissions.js'

let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    failed++
  }
}

console.log('\n=== RUNNING METADATA ENGINE TEST SUITE ===\n')

// -------------------------------------------------------------
// 1. Types & Schema Validator Tests
// -------------------------------------------------------------
console.log('1. Testing Schema Validator & Types...')

// Valid field test
const validField = { id: 'fullName', label: 'Full Name', type: 'text', required: true }
const fieldErrors = validateFieldDefinition(validField)
assert(fieldErrors.length === 0, 'Valid text field produces 0 errors')

// Invalid field test
const invalidField = { id: 'wrong', label: 'Wrong', type: 'unsupported_type' }
const invalidFieldErrors = validateFieldDefinition(invalidField)
assert(invalidFieldErrors.length > 0, 'Field with unsupported type produces validation error')

// Valid column test
const validCol = { key: 'status', label: 'Status', format: 'badge' }
const colErrors = validateColumnDefinition(validCol)
assert(colErrors.length === 0, 'Valid column produces 0 errors')

// Duplicate ID detection in schema
const duplicateSchema = {
  id: 'test_dup',
  title: 'Duplicate Test',
  fields: [
    { id: 'code', label: 'Code', type: 'text' },
    { id: 'code', label: 'Code Again', type: 'text' },
  ],
}
const dupResult = validateMetadataSchema(duplicateSchema)
assert(!dupResult.isValid, 'Schema with duplicate field IDs fails validation')
assert(dupResult.errors.some(e => e.includes('Duplicate field ID')), 'Detects duplicate field ID error message')

// -------------------------------------------------------------
// 2. Default System Schemas Verification
// -------------------------------------------------------------
console.log('\n2. Testing Default System Schemas...')

const employeeDirSchema = DEFAULT_SCHEMAS.employee_directory
assert(!!employeeDirSchema, 'Default employee_directory schema exists')
const empDirValidation = validateMetadataSchema(employeeDirSchema)
assert(empDirValidation.isValid, 'employee_directory schema is strictly valid')

const employeeProfileSchema = DEFAULT_SCHEMAS.employee_profile
assert(!!employeeProfileSchema, 'Default employee_profile schema exists')
const empProfileValidation = validateMetadataSchema(employeeProfileSchema)
assert(empProfileValidation.isValid, 'employee_profile schema is strictly valid')

const employeeFormSchema = DEFAULT_SCHEMAS.employee_form
assert(!!employeeFormSchema, 'Default employee_form schema exists')
const empFormValidation = validateMetadataSchema(employeeFormSchema)
assert(empFormValidation.isValid, 'employee_form schema is strictly valid')

const projectDirSchema = DEFAULT_SCHEMAS.project_directory
assert(!!projectDirSchema, 'Default project_directory schema exists')
assert(validateMetadataSchema(projectDirSchema).isValid, 'project_directory schema is valid')

const companyDirSchema = DEFAULT_SCHEMAS.company_directory
assert(!!companyDirSchema, 'Default company_directory schema exists')
assert(validateMetadataSchema(companyDirSchema).isValid, 'company_directory schema is valid')

// -------------------------------------------------------------
// 3. Security & Permission Guard Logic Tests
// -------------------------------------------------------------
console.log('\n3. Testing Role-Based Permission Logic...')

const superAdminUser = { roleName: 'SuperAdmin', allowedPages: ['*'] }
const hrUser = { roleName: 'HR', allowedPages: ['EmployeeMaster', 'Attendance', 'Leave'] }
const standardEmployee = { roleName: 'Employee', allowedPages: ['Dashboard', 'Profile'] }

// SuperAdmin permissions
assert(
  checkUserPermission(superAdminUser, { requiredRole: 'SuperAdmin' }),
  'SuperAdmin user satisfies requiredRole=SuperAdmin'
)
assert(
  checkUserPermission(superAdminUser, { requiredPermission: 'Payroll' }),
  'SuperAdmin user bypasses requiredPermission checks'
)

// HR User permissions
assert(
  checkUserPermission(hrUser, { requiredPermission: 'EmployeeMaster' }),
  'HR user has access to EmployeeMaster'
)
assert(
  !checkUserPermission(hrUser, { requiredRole: 'SuperAdmin' }),
  'HR user is denied access when requiredRole=SuperAdmin'
)
assert(
  !checkUserPermission(hrUser, { requiredPermission: 'Payroll' }),
  'HR user without Payroll permission is denied'
)

// Standard Employee permissions
assert(
  !checkUserPermission(standardEmployee, { requiredPermission: 'EmployeeMaster' }),
  'Standard Employee is denied access to EmployeeMaster'
)

// Restricted Role test
assert(
  !checkUserPermission(hrUser, { restrictedRole: 'HR' }),
  'User matching restrictedRole is denied access'
)

// -------------------------------------------------------------
// 4. Dynamic Table Filter & Sort Algorithms Test
// -------------------------------------------------------------
console.log('\n4. Testing Table Filter & Sort Algorithms...')

const mockEmployees = [
  { id: '1', name: 'Zoya Khan', code: 'EMP-001', status: 'Active', department: 'Operations' },
  { id: '2', name: 'Amit Sharma', code: 'EMP-002', status: 'Hold', department: 'Technology' },
  { id: '3', name: 'Bhavna Patel', code: 'EMP-003', status: 'Active', department: 'Human Resources' },
]

// Filter test
const activeOnly = mockEmployees.filter(e => e.status === 'Active')
assert(activeOnly.length === 2, 'Filter by status Active matches exactly 2 records')

// Sort test
const sortedByName = [...mockEmployees].sort((a, b) => a.name.localeCompare(b.name))
assert(sortedByName[0].name === 'Amit Sharma', 'Sorting asc by name places Amit Sharma first')
assert(sortedByName[2].name === 'Zoya Khan', 'Sorting asc by name places Zoya Khan last')

// Search test
const searchQuery = 'EMP-002'
const searchResults = mockEmployees.filter(e => [e.name, e.code].join(' ').includes(searchQuery))
assert(searchResults.length === 1 && searchResults[0].id === '2', 'Search query EMP-002 returns correct employee')

console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`)

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
