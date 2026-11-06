using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class AccountingPeriodService : IAccountingPeriodService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public AccountingPeriodService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<AccountingPeriod> CloseAsync(
            int year,
            int month,
            Guid? closedBy,
            string? notes,
            CancellationToken cancellationToken = default)
        {
            if (month is < 1 or > 12)
                throw new InvalidOperationException("Month must be 1-12.");

            var row = await _db.AccountingPeriods.FirstOrDefaultAsync(
                p => p.Year == year && p.Month == month, cancellationToken);
            if (row == null)
            {
                row = new AccountingPeriod
                {
                    TenantId = _tenantAccessor.GetTenantId(),
                    Year = year,
                    Month = month,
                    CreatedAt = DateTime.UtcNow
                };
                _db.AccountingPeriods.Add(row);
            }

            row.Status = "Closed";
            row.ClosedAt = DateTime.UtcNow;
            row.ClosedBy = closedBy;
            row.Notes = notes;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }

        public async Task<AccountingPeriod> ReopenAsync(int year, int month, CancellationToken cancellationToken = default)
        {
            var row = await _db.AccountingPeriods.FirstOrDefaultAsync(
                p => p.Year == year && p.Month == month, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Period not found.");

            row.Status = "Open";
            row.ClosedAt = null;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }
    }
}
