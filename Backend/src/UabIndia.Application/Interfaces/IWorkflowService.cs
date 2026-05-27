using System;
using System.Threading.Tasks;
using UabIndia.Application.Models;

namespace UabIndia.Application.Interfaces
{
    public interface IWorkflowService
    {
        Task<WorkflowInstanceDto> StartInstanceAsync(StartInstanceRequestDto request, Guid initiatedBy);
        Task<WorkflowInstanceDto> GetInstanceAsync(Guid instanceId);
        Task<WorkflowInstanceDto> PerformActionAsync(Guid instanceId, ActionRequestDto actionRequest, Guid performedBy, string? ifMatchRowVersion = null);
    }
}
