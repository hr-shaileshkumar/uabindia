using System;
using System.Threading.Tasks;

namespace UabIndia.Core.Services
{
    public interface IIndianEnterpriseDemoSeeder
    {
        Task<DemoSeedResult> SeedDemoTenantAsync(Guid tenantId);
    }

    public class DemoSeedResult
    {
        public bool Success { get; set; }
        public int AccountsCreated { get; set; }
        public int VendorsCreated { get; set; }
        public int CustomersCreated { get; set; }
        public int EmployeesCreated { get; set; }
        public int ItemsCreated { get; set; }
        public int InvoicesCreated { get; set; }
        public int AttendanceCreated { get; set; }
        public bool CompanyCreated { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
