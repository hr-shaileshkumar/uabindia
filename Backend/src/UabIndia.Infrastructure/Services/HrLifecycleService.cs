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
    public class HrLifecycleService : IHrLifecycleService
    {
        private readonly ApplicationDbContext _db;

        public HrLifecycleService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<LifecycleExecutionResult> InitializeEmployeeLifecycleTasksAsync(
            Guid tenantId,
            Guid employeeId,
            string lifecycleKind = "Onboarding",
            CancellationToken ct = default)
        {
            var employee = await _db.Employees.IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == tenantId && !e.IsDeleted, ct);

            var empName = !string.IsNullOrWhiteSpace(employee?.FullName) ? employee.FullName.Trim() : "Employee";
            var kind = string.IsNullOrWhiteSpace(lifecycleKind) ? "Onboarding" : lifecycleKind.Trim();

            var taskTemplates = GetDefaultLifecycleTasks(kind, empName);
            var result = new LifecycleExecutionResult
            {
                EmployeeId = employeeId,
                EmployeeName = empName,
                LifecycleKind = kind
            };

            var now = DateTime.UtcNow;

            foreach (var template in taskTemplates)
            {
                var task = new HrLifecycleTask
                {
                    TenantId = tenantId,
                    EmployeeId = employeeId,
                    Kind = kind,
                    Title = template.Title,
                    Category = template.Category,
                    Notes = template.Description,
                    Status = "Pending",
                    DueDate = now.AddDays(template.DueDays)
                };

                _db.HrLifecycleTasks.Add(task);
                result.TasksCreatedCount++;

                result.CreatedTasks.Add(new HrLifecycleTaskSummary
                {
                    TaskId = task.Id,
                    Title = task.Title,
                    Category = task.Category,
                    Status = task.Status,
                    DueDate = task.DueDate.Value
                });
            }

            await _db.SaveChangesAsync(ct);
            return result;
        }

        private static List<(string Title, string Category, string Description, int DueDays)> GetDefaultLifecycleTasks(string kind, string empName)
        {
            if (kind.Equals("Offboarding", StringComparison.OrdinalIgnoreCase))
            {
                return new List<(string, string, string, int)>
                {
                    ("Conduct Exit Interview", "HR", $"Schedule and record formal exit interview feedback for {empName}.", 3),
                    ("Handover Company IT Assets (Laptop/Devices)", "IT", $"Collect hardware, monitor, phone, and tokens from {empName}.", 5),
                    ("Revoke System & ERP Access Credentials", "IT", $"Deactivate single sign-on, email, VPN, and database permissions for {empName}.", 5),
                    ("Calculate Full & Final Settlement (F&F)", "Payroll", $"Compute leave encashment, gratuity, and final salary settlement for {empName}.", 7),
                    ("Issue Experience & Relieving Certificate", "HR", $"Generate and dispatch formal relieving letter and service certificate to {empName}.", 10)
                };
            }

            // Default: Onboarding
            return new List<(string, string, string, int)>
            {
                ("Identity & Educational Document Verification", "HR", $"Collect and verify identity proof, tax IDs, and academic certificates for {empName}.", 2),
                ("Direct Deposit / Bank Account Setup", "Payroll", $"Record and verify employee bank details for statutory payroll disbursal for {empName}.", 3),
                ("IT Hardware Provisioning (Laptop/Accessories)", "IT", $"Assign and configure workstation, security tokens, and hardware for {empName}.", 1),
                ("Enterprise System Access & Single Sign-On", "IT", $"Provision corporate email, Slack, GitHub/ERP accounts, and role permissions for {empName}.", 1),
                ("Statutory Compliance & Benefits Enrollment", "HR", $"Enroll {empName} in Provident Fund/401k, Group Health Insurance, and ESI.", 5),
                ("Schedule Manager & Team Introduction", "HR", $"Set up 1-on-1 welcome session and team orientation meeting for {empName}.", 3)
            };
        }
    }
}
