# DTO/PII Masking Audit

Scope: Users, Payroll, Attendance, Leave (API DTOs). Goal: expose minimum required fields only.

## Users
- DTO: UserDto
- Exposed fields: `Id`, `Email`, `FullName`, `IsActive`, `Roles`
- Sensitive fields excluded: `PasswordHash`, refresh tokens, auth metadata
- Status: OK

## Payroll
- DTOs: PayrollRunDto, PayslipDto
- Exposed fields:
  - PayrollRunDto: `Id`, `CompanyId`, `RunDate`, `Status`
  - PayslipDto: `Id`, `PayrollRunId`, `EmployeeId`, `Gross`, `Net`, `Details`
- Sensitive fields excluded: employee PII beyond IDs
- Action: verify `Details` payload contains no sensitive content

## Attendance
- DTOs: AttendancePunchDto, AttendanceRecordDto
- Exposed fields:
  - AttendancePunchDto (input): `EmployeeId`, `ProjectId`, `PunchType`, `Timestamp`, `Latitude`, `Longitude`, `DeviceId`, `Source`
  - AttendanceRecordDto (output): `Id`, `EmployeeId`, `ProjectId`, `PunchType`, `Timestamp`
- Sensitive fields excluded from output: location/IP/device data
- Status: OK (output minimized)

## Leave
- DTOs: LeavePolicyDto, LeaveRequestDto
- Exposed fields:
  - LeavePolicyDto: `Id`, `Name`, `Type`, `EntitlementPerYear`, `CarryForwardAllowed`, `MaxCarryForward`
  - LeaveRequestDto: `Id`, `EmployeeId`, `LeavePolicyId`, `FromDate`, `ToDate`, `Days`, `Status`, `ApprovedBy`, `ApprovedAt`, `Reason`
- Sensitive fields excluded: personal info beyond EmployeeId
- Status: OK

## Notes
- Ensure logging in non‑development does not emit request bodies or sensitive details.
- Keep UI‑only frontend; no client‑side RBAC or hidden business rules.
