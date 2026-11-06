using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public class DataScopeContext
    {
        public Guid UserId { get; set; }
        public Guid TenantId { get; set; }
        public Guid? UserCompanyId { get; set; }
        public Guid? UserProjectId { get; set; }
        public Guid? UserDepartmentId { get; set; }
        public Guid? EmployeeId { get; set; }
        public List<string> Roles { get; set; } = new();
        public bool IsSuperAdmin { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class EntityScopeTarget
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? DepartmentId { get; set; }
        public Guid? OwnerUserId { get; set; }
        public Guid? EmployeeId { get; set; }
        public Guid? ReportingManagerId { get; set; }
    }

    public interface IDataScopeEvaluator
    {
        Task<bool> CanAccessRecordAsync(
            DataScopeContext userContext,
            string moduleKey,
            string entityName,
            string action,
            EntityScopeTarget targetRecord,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<DataScope>> GetEffectiveScopesForUserAsync(
            Guid tenantId,
            Guid userId,
            string? moduleKey = null,
            CancellationToken cancellationToken = default);
    }
}
