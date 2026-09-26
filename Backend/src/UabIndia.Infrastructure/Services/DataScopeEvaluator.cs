using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class DataScopeEvaluator : IDataScopeEvaluator
    {
        private readonly ApplicationDbContext _db;

        public DataScopeEvaluator(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<bool> CanAccessRecordAsync(
            DataScopeContext userContext,
            string moduleKey,
            string entityName,
            string action,
            EntityScopeTarget targetRecord,
            CancellationToken cancellationToken = default)
        {
            // SuperAdmins and TenantAdmins have unrestricted access across scopes
            if (userContext.IsSuperAdmin || userContext.IsAdmin)
            {
                return true;
            }

            var effectiveScopes = await GetEffectiveScopesForUserAsync(
                userContext.TenantId,
                userContext.UserId,
                moduleKey,
                cancellationToken);

            // If no explicit data scopes are defined, default to Company or Tenant scope
            if (!effectiveScopes.Any())
            {
                // Fallback default: if user belongs to a company, must match company
                if (userContext.UserCompanyId.HasValue && targetRecord.CompanyId.HasValue)
                {
                    return userContext.UserCompanyId.Value == targetRecord.CompanyId.Value;
                }
                return true;
            }

            foreach (var scope in effectiveScopes)
            {
                switch (scope.Level)
                {
                    case DataScopeLevel.Tenant:
                        return true;

                    case DataScopeLevel.Company:
                        if (!userContext.UserCompanyId.HasValue || !targetRecord.CompanyId.HasValue) return false;
                        if (userContext.UserCompanyId.Value == targetRecord.CompanyId.Value) return true;
                        break;

                    case DataScopeLevel.Project:
                        if (!userContext.UserProjectId.HasValue || !targetRecord.ProjectId.HasValue) return false;
                        if (userContext.UserProjectId.Value == targetRecord.ProjectId.Value) return true;
                        break;

                    case DataScopeLevel.Department:
                        if (!userContext.UserDepartmentId.HasValue || !targetRecord.DepartmentId.HasValue) return false;
                        if (userContext.UserDepartmentId.Value == targetRecord.DepartmentId.Value) return true;
                        break;

                    case DataScopeLevel.Self:
                        if (targetRecord.OwnerUserId.HasValue && targetRecord.OwnerUserId.Value == userContext.UserId) return true;
                        if (userContext.EmployeeId.HasValue && targetRecord.EmployeeId.HasValue && userContext.EmployeeId.Value == targetRecord.EmployeeId.Value) return true;
                        break;

                    case DataScopeLevel.ReportingHierarchy:
                        if (targetRecord.ReportingManagerId.HasValue && targetRecord.ReportingManagerId.Value == userContext.UserId) return true;
                        if (targetRecord.OwnerUserId.HasValue && targetRecord.OwnerUserId.Value == userContext.UserId) return true;
                        break;
                }
            }

            return false;
        }

        public async Task<IReadOnlyList<DataScope>> GetEffectiveScopesForUserAsync(
            Guid tenantId,
            Guid userId,
            string? moduleKey = null,
            CancellationToken cancellationToken = default)
        {
            var userRoleIds = await _db.UserRoles
                .AsNoTracking()
                .Where(ur => ur.TenantId == tenantId && ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync(cancellationToken);

            if (!userRoleIds.Any())
            {
                return Array.Empty<DataScope>();
            }

            var query = _db.RoleDataScopes
                .AsNoTracking()
                .Include(rds => rds.DataScope)
                .Where(rds => rds.TenantId == tenantId && userRoleIds.Contains(rds.RoleId) && !rds.IsDeleted && rds.DataScope != null && rds.DataScope.IsActive);

            if (!string.IsNullOrWhiteSpace(moduleKey))
            {
                query = query.Where(rds => string.IsNullOrEmpty(rds.ModuleKey) || rds.ModuleKey.ToLower() == moduleKey.ToLower());
            }

            var scopes = await query
                .Select(rds => rds.DataScope!)
                .Distinct()
                .ToListAsync(cancellationToken);

            return scopes;
        }
    }
}
