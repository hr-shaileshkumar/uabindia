using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class OvertimeApprovalService : IOvertimeApprovalService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OvertimeApprovalService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<OvertimeApproval> DecideAsync(
            CreateOvertimeApprovalCommand command,
            CancellationToken cancellationToken = default)
        {
            if (command.ApproverId == Guid.Empty)
                throw new UnauthorizedAccessException("Invalid approver");

            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.OvertimeRequests.FirstOrDefaultAsync(
                r => r.Id == command.OvertimeRequestId && r.TenantId == tenantId && !r.IsDeleted,
                cancellationToken);
            if (request == null)
                throw new KeyNotFoundException("Overtime request not found");

            var now = DateTime.UtcNow;
            var approval = new OvertimeApproval
            {
                TenantId = tenantId,
                OvertimeRequestId = request.Id,
                ApproverId = command.ApproverId,
                ApproverName = string.IsNullOrWhiteSpace(command.ApproverName) ? "Manager" : command.ApproverName,
                ApproverRole = string.IsNullOrWhiteSpace(command.ApproverRole) ? "Manager" : command.ApproverRole,
                Status = command.Status,
                ApprovalNotes = command.ApprovalNotes,
                RejectionReason = command.RejectionReason,
                ApprovedHours = command.ApprovedHours,
                ApprovedAmount = command.ApprovedAmount,
                ApprovalLevel = 1,
                IsRequired = true,
                CreatedAt = now
            };

            if (command.Status == ApprovalStatus.Approved)
            {
                approval.ApprovedDate = now;
                request.Status = OvertimeRequestStatus.Approved;

                var effectiveHours = command.ApprovedHours ?? (request.NetOvertimeHours > 0 ? request.NetOvertimeHours : request.TotalHours);
                if (effectiveHours <= 0) effectiveHours = 1m;

                var employee = await _db.Employees.AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.TenantId == tenantId, cancellationToken);

                // 1. Time-Off Compensation -> Credit CompOffRecord in HRMS Leave Ledger
                if (request.CompensationType == CompensationType.TimeOff || request.CompensationType == CompensationType.Both)
                {
                    var compOffDays = Math.Round(effectiveHours / 8m, 2, MidpointRounding.AwayFromZero);
                    if (compOffDays < 0.5m) compOffDays = 0.5m;

                    var compOff = new CompOffRecord
                    {
                        TenantId = tenantId,
                        EmployeeId = request.EmployeeId,
                        WorkedDate = request.OvertimeDate.Date,
                        DaysGranted = compOffDays,
                        DaysRemaining = compOffDays,
                        ExpiryDate = request.OvertimeDate.Date.AddDays(60),
                        Status = CompOffStatus.Approved,
                        Reason = $"Comp-Off earned for {effectiveHours}h overtime on {request.OvertimeDate:yyyy-MM-dd} ({request.OvertimeType})",
                        ApprovedBy = command.ApproverId,
                        ApprovedAt = now
                    };
                    _db.CompOffRecords.Add(compOff);
                }

                // 2. Cash Compensation -> Calculate statutory rate & queue into PayrollBonus
                if (request.CompensationType == CompensationType.Cash || request.CompensationType == CompensationType.Both)
                {
                    decimal amount = command.ApprovedAmount ?? 0m;
                    if (amount <= 0 && employee != null)
                    {
                        var basic = employee.BasicSalary > 0 ? employee.BasicSalary : (employee.MonthlyCtc * 0.40m);
                        // Standard statutory hourly rate: Basic / 208 hours (26 days * 8 hours)
                        var hourlyRate = basic > 0 ? (basic / 208m) : 0m;
                        var multiplier = request.OvertimeRate > 0
                            ? request.OvertimeRate
                            : (request.OvertimeType == OvertimeType.Weekend || request.OvertimeType == OvertimeType.Holiday ? 2.0m : 1.5m);

                        amount = Math.Round(effectiveHours * hourlyRate * multiplier, 2, MidpointRounding.AwayFromZero);
                    }

                    approval.ApprovedAmount = amount;
                    request.OvertimeAmount = amount;

                    if (amount > 0)
                    {
                        var bonus = new PayrollBonus
                        {
                            TenantId = tenantId,
                            EmployeeId = request.EmployeeId,
                            EmployeeName = employee?.FullName ?? "Employee",
                            EmployeeCode = employee?.EmployeeCode ?? "—",
                            BonusType = "Overtime",
                            Amount = amount,
                            PaymentMonth = request.OvertimeDate.ToString("yyyy-MM"),
                            Remarks = $"Approved overtime payout for {effectiveHours}h on {request.OvertimeDate:yyyy-MM-dd}",
                            Status = "Approved",
                            PaidAt = null
                        };
                        _db.PayrollBonuses.Add(bonus);
                    }
                }
            }
            else if (command.Status == ApprovalStatus.Rejected)
            {
                approval.RejectedDate = now;
                request.Status = OvertimeRequestStatus.Rejected;
            }

            request.UpdatedAt = now;
            _db.OvertimeApprovals.Add(approval);
            await _db.SaveChangesAsync(cancellationToken);
            return approval;
        }
    }
}
