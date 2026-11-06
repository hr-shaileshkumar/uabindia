using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class OrgUnitDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid CompanyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class DepartmentDto : OrgUnitDto
    {
        public Guid? ParentDepartmentId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class DesignationDto : OrgUnitDto
    {
        public string? Grade { get; set; }
        public string? Level { get; set; }
    }

    public class BranchDto : OrgUnitDto
    {
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Gstin { get; set; }
        public bool IsWarehouse { get; set; }
    }

    public class CostCenterDto : OrgUnitDto
    {
        public string? CostCenterType { get; set; }
    }

    public class BusinessUnitDto : OrgUnitDto
    {
        public Guid? ParentBusinessUnitId { get; set; }
    }

    public class UpsertOrgUnitRequest
    {
        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(64)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpsertDepartmentRequest : UpsertOrgUnitRequest
    {
        public Guid? ParentDepartmentId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class UpsertDesignationRequest : UpsertOrgUnitRequest
    {
        public string? Grade { get; set; }
        public string? Level { get; set; }
    }

    public class UpsertBranchRequest : UpsertOrgUnitRequest
    {
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Gstin { get; set; }
        public bool IsWarehouse { get; set; }
    }

    public class UpsertCostCenterRequest : UpsertOrgUnitRequest
    {
        public string? CostCenterType { get; set; }
    }

    public class UpsertBusinessUnitRequest : UpsertOrgUnitRequest
    {
        public Guid? ParentBusinessUnitId { get; set; }
    }
}
