using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class DocumentNumberService : IDocumentNumberService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public DocumentNumberService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<string> NextAsync(string entityName, string prefix, int padding = 5, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var row = await _db.BusinessIdSequences
                .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.EntityName == entityName, cancellationToken);

            if (row == null)
            {
                row = new BusinessIdSequence
                {
                    TenantId = tenantId,
                    EntityName = entityName,
                    Prefix = prefix,
                    Padding = padding,
                    CurrentValue = 0,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.BusinessIdSequences.Add(row);
            }

            row.CurrentValue += 1;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return $"{prefix}{row.CurrentValue.ToString().PadLeft(padding, '0')}";
        }
    }
}
