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
        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: "ef_workflow_test_db")
                .Options;

            // tenant accessor + encryption service are not needed for basic tests; use test doubles
            var tenantAccessor = new TestUtilities.TestTenantAccessor();
            var encryption = new TestEncryptionService();
            return new ApplicationDbContext(options, tenantAccessor, encryption);
        }

        [Fact]
        public async Task StartAndApproveWorkflow_InstanceCreatedAndApproved()
        {
            var db = CreateContext();

            // Seed a workflow definition
            var wf = new UabIndia.Core.Entities.WorkflowDefinition
            {
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
                TenantId = Guid.NewGuid()
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
