using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Controllers;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class HelpdeskControllerTests
    {
        [Fact]
        public async Task CreateTicket_ThenList_ReturnsTenantTicket()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            db.Users.Add(new User
            {
                Id = userId,
                TenantId = tenantId,
                Email = "support@tenant.test",
                PasswordHash = "hash",
                IsActive = true
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, userId, "Admin");
            var create = await controller.CreateTicket(new CreateHelpdeskTicketDto
            {
                Subject = "VPN access issue",
                Description = "Unable to connect to VPN from branch office.",
                Category = "IT",
                Priority = "High"
            });

            Assert.IsType<OkObjectResult>(create);

            var list = await controller.ListTickets(limit: 10);
            var ok = Assert.IsType<OkObjectResult>(list);
            var payload = JsonSerializer.Serialize(ok.Value);
            Assert.NotNull(payload);
            Assert.Contains("VPN access issue", payload, StringComparison.Ordinal);
        }

        [Fact]
        public async Task CreateEscalation_UpdatesTicketStatusToEscalated()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            db.Users.AddRange(
                new User { Id = userId, TenantId = tenantId, Email = "requester@tenant.test", PasswordHash = "hash", IsActive = true },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "manager@tenant.test", PasswordHash = "hash", IsActive = true });

            var ticket = new HelpdeskTicket
            {
                TenantId = tenantId,
                TicketNumber = "TKT-20260518-0001",
                Subject = "Payroll discrepancy",
                Description = "Issue needs escalation",
                Category = "Payroll",
                Priority = "High",
                Status = "Open",
                RequesterUserId = userId
            };
            db.HelpdeskTickets.Add(ticket);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, userId, "Admin");
            var result = await controller.CreateEscalation(new CreateHelpdeskEscalationDto
            {
                TicketId = ticket.Id,
                Reason = "SLA threshold exceeded",
                SlaBreached = true
            });

            Assert.IsType<OkObjectResult>(result);
            var updatedTicket = await db.HelpdeskTickets.FirstAsync(t => t.Id == ticket.Id);
            Assert.Equal("Escalated", updatedTicket.Status);
        }

        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static HelpdeskController CreateController(ApplicationDbContext db, TestTenantAccessor tenantAccessor, Guid userId, string role)
        {
            return new HelpdeskController(db, tenantAccessor)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                            new Claim(ClaimTypes.Role, role)
                        }, "TestAuth"))
                    }
                }
            };
        }
    }
}
