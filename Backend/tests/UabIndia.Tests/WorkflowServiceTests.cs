using System;
using System.Threading.Tasks;
using UabIndia.Infrastructure.Services;
using UabIndia.Application.Models;
using Xunit;

namespace UabIndia.Tests
{
    public class WorkflowServiceTests
    {
        [Fact]
        public async Task LeaveWorkflow_Start_Submit_Approve_Flow()
        {
            var service = new WorkflowService();

            var startReq = new StartInstanceRequestDto
            {
                DefinitionKey = "leave_approval",
                BusinessKey = "LEAVE-1001",
                TenantId = Guid.NewGuid()
            };

            var instance = await service.StartInstanceAsync(startReq, Guid.NewGuid());
            Assert.NotNull(instance);
            Assert.Equal("Pending", instance.Status);
            Assert.Equal("apply", instance.CurrentStepKey);

            var submit = new ActionRequestDto { ActionType = "submit", StepKey = "apply" };
            var afterSubmit = await service.PerformActionAsync(instance.Id, submit, Guid.NewGuid());
            Assert.Equal("InProgress", afterSubmit.Status);
            Assert.Equal("manager_approval", afterSubmit.CurrentStepKey);

            var approve = new ActionRequestDto { ActionType = "approve", StepKey = "manager_approval" };
            var afterApprove = await service.PerformActionAsync(instance.Id, approve, Guid.NewGuid());
            Assert.Equal("InProgress", afterApprove.Status);
            Assert.Equal("hr_approval", afterApprove.CurrentStepKey);
        }
    }
}
