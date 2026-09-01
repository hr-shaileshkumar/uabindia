using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class LifecycleExecutionResult
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string LifecycleKind { get; set; } = "Onboarding";
        public int TasksCreatedCount { get; set; }
        public List<HrLifecycleTaskSummary> CreatedTasks { get; set; } = new();
    }

    public class HrLifecycleTaskSummary
    {
        public Guid TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "HR";
        public string Status { get; set; } = "Pending";
        public DateTime DueDate { get; set; }
    }

    public interface IHrLifecycleService
    {
        Task<LifecycleExecutionResult> InitializeEmployeeLifecycleTasksAsync(
            Guid tenantId,
            Guid employeeId,
            string lifecycleKind = "Onboarding",
            CancellationToken ct = default);
    }
}
