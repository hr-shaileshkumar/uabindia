using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PayrollSettlementService : IPayrollSettlementService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILedgerPostingService _ledger;

        public PayrollSettlementService(ApplicationDbContext db, ILedgerPostingService ledger)
        {
            _db = db;
            _ledger = ledger;
        }

        public async Task<FnfComputation> ComputeAsync(Guid employeeId, DateTime exitDate, CancellationToken cancellationToken = default)
        {
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId && !e.IsDeleted, cancellationToken);
            if (employee == null)
                throw new InvalidOperationException("Employee not found.");

            var join = employee.DateOfJoining ?? employee.CreatedAt;
            var years = Math.Max(0d, (exitDate.Date - join.Date).TotalDays / 365.25d);
            var yearsRounded = (decimal)Math.Round(years, 0, MidpointRounding.AwayFromZero);
            var lastBasic = employee.BasicSalary > 0 ? employee.BasicSalary : IndiaStatutoryCalculator.RoundMoney(employee.MonthlyCtc * 0.40m);
            var gratuity = years >= 4.5d && lastBasic > 0
                ? IndiaStatutoryCalculator.RoundMoney(lastBasic * 15m / 26m * yearsRounded)
                : 0m;

            var year = exitDate.Year;
            var leaveBalance = await _db.EmployeeLeaves.AsNoTracking()
                .Where(l => l.EmployeeId == employee.Id && l.Year == year && !l.IsDeleted)
                .SumAsync(l => (decimal?)l.Balance, cancellationToken) ?? 0m;
            var daily = employee.MonthlyCtc > 0 ? employee.MonthlyCtc / 30m : lastBasic / 30m;
            var leaveEncashment = IndiaStatutoryCalculator.RoundMoney(Math.Max(0m, leaveBalance) * daily);

            var recoveries = await _db.PayrollLoans
                .Where(l => l.EmployeeId == employee.Id && !l.IsDeleted && l.Status == "Active")
                .SumAsync(l => (decimal?)l.OutstandingAmount, cancellationToken) ?? 0m;

            var lastSlip = await _db.Payslips.AsNoTracking()
                .Where(p => p.EmployeeId == employee.Id && !p.IsDeleted)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .FirstOrDefaultAsync(cancellationToken);
            decimal otherDues = 0m;
            if (lastSlip != null)
            {
                var lastEnd = new DateTime(lastSlip.Year, Math.Clamp(lastSlip.Month, 1, 12), 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1).AddDays(-1);
                if (exitDate.Date > lastEnd.Date)
                {
                    var days = (exitDate.Date - lastEnd.Date).Days;
                    otherDues = IndiaStatutoryCalculator.RoundMoney(daily * days);
                }
            }

            return new FnfComputation(
                gratuity,
                leaveEncashment,
                otherDues,
                recoveries,
                $"Auto F&F: service {years:0.00}y; leave {leaveBalance:0.##}d; daily {daily:0.00}");
        }

        public async Task<PayrollSettlementPostResult> SettleAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await _db.PayrollFinalSettlements.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Settlement not found.");
            if (string.Equals(row.Status, "Settled", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Settlement already posted.");

            Guid? journalId = null;
            if (row.TotalSettlement != 0)
            {
                var payout = row.TotalSettlement > 0;
                var journal = await _ledger.PostAsync(
                    "JE-FNF-",
                    row.ExitDate == default ? DateTime.UtcNow : row.ExitDate,
                    payout
                        ? $"Full and final settlement {row.EmployeeName}"
                        : $"Full and final recovery {row.EmployeeName}",
                    CommercialLedgerLines.FinalSettlement(row.TotalSettlement),
                    "PayrollFinalSettlement",
                    row.Id,
                    cancellationToken);
                journalId = journal.Id;
            }

            row.Status = "Settled";
            row.SettledAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new PayrollSettlementPostResult(row.Id, journalId);
        }
    }
}
