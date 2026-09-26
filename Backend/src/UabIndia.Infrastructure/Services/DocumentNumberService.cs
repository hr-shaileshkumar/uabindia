using System;
using System.Linq;
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

        public Task<string> NextAsync(
            string entityName,
            string prefix,
            int padding = 5,
            CancellationToken cancellationToken = default)
        {
            return NextAsync(entityName, prefix, padding, null, null, null, cancellationToken);
        }

        public async Task<string> NextAsync(
            string entityName,
            string prefix,
            int padding,
            Guid? companyId,
            Guid? projectId = null,
            string? fiscalYear = null,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var targetCompanyId = companyId ?? _tenantAccessor.GetCompanyId();
            var targetProjectId = projectId ?? _tenantAccessor.GetProjectId();
            var targetFiscalYear = fiscalYear ?? _tenantAccessor.GetFinancialYearKey();

            // 1. Resolve Company Code if company is present (e.g. Bhavya Steels -> BHS, Icon Pvt Ltd -> IOC)
            string? companyCode = null;
            if (targetCompanyId.HasValue && targetCompanyId.Value != Guid.Empty)
            {
                var company = await _db.Companies
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == targetCompanyId.Value && c.TenantId == tenantId, cancellationToken);
                if (company != null)
                {
                    if (!string.IsNullOrWhiteSpace(company.Code))
                    {
                        companyCode = company.Code.Trim().ToUpperInvariant();
                    }
                    else if (!string.IsNullOrWhiteSpace(company.Name))
                    {
                        var words = company.Name.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
                        companyCode = words.Length >= 2
                            ? string.Concat(words.Take(3).Select(w => char.ToUpperInvariant(w[0])))
                            : (company.Name.Length >= 3 ? company.Name.Substring(0, 3).ToUpperInvariant() : company.Name.ToUpperInvariant());
                    }
                }
            }

            // 2. Resolve Project Code if project is present (e.g. Metro Phase 1 -> MP1)
            string? projectCode = null;
            if (targetProjectId.HasValue && targetProjectId.Value != Guid.Empty)
            {
                var project = await _db.Projects
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == targetProjectId.Value && p.TenantId == tenantId, cancellationToken);
                if (project != null && !string.IsNullOrWhiteSpace(project.ProjectCode))
                {
                    projectCode = project.ProjectCode.Trim().ToUpperInvariant();
                }
            }

            // 3. Resolve Effective Prefix with company & project scoping
            var effectivePrefix = prefix;
            if (!string.IsNullOrWhiteSpace(companyCode))
            {
                if (!effectivePrefix.StartsWith(companyCode + "-", StringComparison.OrdinalIgnoreCase) &&
                    !effectivePrefix.StartsWith(companyCode + "/", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrWhiteSpace(projectCode))
                    {
                        effectivePrefix = $"{companyCode}/{projectCode}/{effectivePrefix.TrimStart('-')}";
                    }
                    else
                    {
                        effectivePrefix = $"{companyCode}-{effectivePrefix.TrimStart('-')}";
                    }
                }
            }

            // 4. Query Sequence Row using multi-scope hierarchy:
            // (TenantId + CompanyId + ProjectId + EntityName) -> (TenantId + CompanyId + null + EntityName) -> (TenantId + null + null + EntityName)
            BusinessIdSequence? row = null;
            if (targetCompanyId.HasValue && targetCompanyId.Value != Guid.Empty)
            {
                if (targetProjectId.HasValue && targetProjectId.Value != Guid.Empty)
                {
                    row = await _db.BusinessIdSequences
                        .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.CompanyId == targetCompanyId.Value && s.ProjectId == targetProjectId.Value && s.EntityName == entityName, cancellationToken);
                }

                if (row == null)
                {
                    row = await _db.BusinessIdSequences
                        .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.CompanyId == targetCompanyId.Value && s.ProjectId == null && s.EntityName == entityName, cancellationToken);
                }
            }

            if (row == null)
            {
                row = await _db.BusinessIdSequences
                    .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.CompanyId == null && s.EntityName == entityName, cancellationToken);
            }

            // 5. If no sequence exists for this company, create an isolated company sequence
            if (row == null || (targetCompanyId.HasValue && row.CompanyId != targetCompanyId))
            {
                row = new BusinessIdSequence
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    CompanyId = targetCompanyId,
                    ProjectId = targetProjectId,
                    FiscalYear = targetFiscalYear,
                    EntityName = entityName,
                    Prefix = effectivePrefix,
                    Padding = padding,
                    CurrentValue = 0,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.BusinessIdSequences.Add(row);
            }

            row.CurrentValue += 1;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            var counterPart = row.CurrentValue.ToString().PadLeft(row.Padding > 0 ? row.Padding : padding, '0');
            return $"{effectivePrefix}{counterPart}";
        }
    }
}
