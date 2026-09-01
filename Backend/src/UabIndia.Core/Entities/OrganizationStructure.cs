using System;

namespace UabIndia.Core.Entities
{
    public class Department : BaseOrgEntity
    {
        public Guid? ParentDepartmentId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class Designation : BaseOrgEntity
    {
        public string? Grade { get; set; }
        public string? Level { get; set; }
    }

    public class Branch : BaseOrgEntity
    {
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Gstin { get; set; }
        public bool IsWarehouse { get; set; }
    }

    public class CostCenter : BaseOrgEntity
    {
        public string? CostCenterType { get; set; }
    }

    public class BusinessUnit : BaseOrgEntity
    {
        public Guid? ParentBusinessUnitId { get; set; }
    }
}
