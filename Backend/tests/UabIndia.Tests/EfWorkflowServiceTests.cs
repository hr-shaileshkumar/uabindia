using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Application.Models;
using Xunit;

namespace UabIndia.Tests
{
    public class EfWorkflowServiceTests
    {
        private static (ApplicationDbContext Db, Guid TenantId) CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var tenantAccessor = new TestUtilities.TestTenantAccessor();
            var encryption = new TestEncryptionService();
            return (new ApplicationDbContext(options, tenantAccessor, encryption), tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task StartAndApproveWorkflow_InstanceCreatedAndApproved()
        {
            var (db, tenantId) = CreateContext();

            // Seed a workflow definition
            var wf = new UabIndia.Core.Entities.WorkflowDefinition
            {
                TenantId = tenantId,
                ModuleKey = "leave_approval",
                Name = "Leave Approval",
                IsActive = true
            };
            db.WorkflowDefinitions.Add(wf);
            await db.SaveChangesAsync();

            var svc = new EfWorkflowService(db, new NullLogger<EfWorkflowService>());

            var start = new StartInstanceRequestDto
            {
                DefinitionKey = "leave_approval",
                BusinessKey = Guid.NewGuid().ToString(),
                TenantId = tenantId
            };

            var inst = await svc.StartInstanceAsync(start, Guid.NewGuid());
            Assert.NotNull(inst);
            Assert.Equal("leave_approval", inst.DefinitionKey);

            var updated = await svc.PerformActionAsync(inst.Id, new ActionRequestDto { ActionType = "approve", Notes = "ok" }, Guid.NewGuid(), inst.RowVersion);
            Assert.NotNull(updated);
            Assert.True(updated.Status == "Approved" || updated.Status == "InProgress" || updated.Status == "Completed");
        }
    }
}
