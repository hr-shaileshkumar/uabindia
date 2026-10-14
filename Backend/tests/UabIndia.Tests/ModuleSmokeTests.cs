using System;
using System.Linq;
using System.Net;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UabIndia.Infrastructure.Data;
using Xunit;
using UabIndia.Core.Services;

namespace UabIndia.Tests
{
    public class TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Test");
            builder.UseSetting("Jwt:Key", "test_jwt_key_for_automated_tests_only_0123456789");
            builder.UseSetting("Jwt:Issuer", "test-issuer");
            builder.UseSetting("Jwt:Audience", "test-audience");
            builder.UseSetting("ConnectionStrings:DefaultConnection", "DataSource=:memory:");

            builder.ConfigureAppConfiguration((context, config) =>
            {
                var overrides = new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "test_jwt_key_for_automated_tests_only_0123456789",
                    ["Jwt:Issuer"] = "test-issuer",
                    ["Jwt:Audience"] = "test-audience",
                    ["ConnectionStrings:DefaultConnection"] = "DataSource=:memory:"
                };

                config.AddInMemoryCollection(overrides);
            });

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IEncryptionService, TestEncryptionService>();

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("SmokeTestsDb");
                });
            });
        }
    }

    public class ModuleSmokeTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public ModuleSmokeTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Theory]
        [InlineData("/api/v1/employees")]
        [InlineData("/api/v1/attendance")]
        [InlineData("/api/v1/leave/types")]
        [InlineData("/api/v1/assets/assets")]
        [InlineData("/api/v1/recruitment/job-postings")]
        [InlineData("/api/v1/training/courses")]
        [InlineData("/api/v1/overtime/requests")]
        [InlineData("/api/v1/shifts/shifts")]
        [InlineData("/api/v1/appraisals/cycles")]
        [InlineData("/api/v1/travel/requests")]
        [InlineData("/api/v1/ai/agents")]
        [InlineData("/api/v1/payroll/structures")]
        [InlineData("/api/v1/reports/hr/headcount")]
        [InlineData("/api/v1/reports/payroll/summary")]
        [InlineData("/api/v1/reports/compliance/pf")]
        [InlineData("/api/v1/crm/customers")]
        [InlineData("/api/v1/crm/leads")]
        [InlineData("/api/v1/salesorders")]
        [InlineData("/api/v1/salesquotations")]
        [InlineData("/api/v1/salesinvoices")]
        [InlineData("/api/v1/expenses")]
        [InlineData("/api/v1/grn")]
        [InlineData("/api/v1/bank-reconciliations")]
        [InlineData("/api/v1/org-context/events")]
        [InlineData("/api/v1/payroll/statutory/pf")]
        [InlineData("/api/v1/payroll/tax-declarations")]
        [InlineData("/api/v1/payroll/reimbursements")]
        [InlineData("/api/v1/payroll/settlements")]
        [InlineData("/api/v1/payroll/loans")]
        [InlineData("/api/v1/payroll/bonuses")]
        [InlineData("/api/v1/payroll/arrears")]
        [InlineData("/api/v1/payroll/runs")]
        [InlineData("/api/v1/admin/settings")]
        [InlineData("/api/v1/training/assessments")]
        [InlineData("/api/v1/training/certificates")]
        [InlineData("/api/v1/companies")]
        [InlineData("/api/v1/project-tasks")]
        [InlineData("/api/v1/timesheets")]
        [InlineData("/api/v1/notifications/me")]
        [InlineData("/api/v1/notifications/me/unread-count")]
        [InlineData("/api/v1/search?q=demo")]
        [InlineData("/api/v1/entity-fields/definitions/Employee")]
        [InlineData("/api/v1/entity-fields/definitions/SalesInvoice")]
        [InlineData("/api/v1/entity-fields/definitions/Project")]
        [InlineData("/api/v1/integrations")]
        [InlineData("/api/v1/integrations/logs")]
        [InlineData("/api/v1/integrations/api-keys")]
        [InlineData("/api/v1/security/sso-providers")]
        [InlineData("/api/v1/security/ip-rules")]
        [InlineData("/api/v1/security/mfa-policy")]
        [InlineData("/api/v1/security/mfa-enrollments")]
        [InlineData("/api/v1/security/password-policy")]
        [InlineData("/api/v1/reports/custom")]
        [InlineData("/api/v1/reports/financial/trial-balance")]
        [InlineData("/api/v1/licensing/usage")]
        [InlineData("/api/v1/licensing/invoices")]
        [InlineData("/api/v1/subscriptions/current")]
        [InlineData("/api/v1/webhooks")]
        [InlineData("/api/v1/tax/gst/gstr1")]
        [InlineData("/api/v1/tax/gst/gstr3b")]
        public async Task ProtectedEndpoints_RequireAuth(string url)
        {
            var response = await _client.GetAsync(url);
            Assert.Contains(response.StatusCode, new[]
            {
                HttpStatusCode.Unauthorized,
                HttpStatusCode.Forbidden,
                HttpStatusCode.BadRequest,
                HttpStatusCode.Conflict
            });
        }

        [Theory]
        [InlineData("/api/v1/expenses/00000000-0000-0000-0000-000000000001/approve")]
        [InlineData("/api/v1/expenses/00000000-0000-0000-0000-000000000001/reject")]
        [InlineData("/api/v1/expenses/00000000-0000-0000-0000-000000000001/mark-paid")]
        [InlineData("/api/v1/crm/leads/00000000-0000-0000-0000-000000000001/convert-to-quotation")]
        [InlineData("/api/v1/salesquotations/00000000-0000-0000-0000-000000000001/convert-to-order")]
        [InlineData("/api/v1/salesorders/00000000-0000-0000-0000-000000000001/convert-to-invoice")]
        [InlineData("/api/v1/grn/00000000-0000-0000-0000-000000000001/accept")]
        [InlineData("/api/v1/ai/chat")]
        [InlineData("/api/v1/timesheets/00000000-0000-0000-0000-000000000001/approve")]
        [InlineData("/api/v1/notifications/me/read-all")]
        public async Task Week56ActionEndpoints_RequireAuth(string url)
        {
            var response = await _client.PostAsync(url, new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
            Assert.Contains(response.StatusCode, new[]
            {
                HttpStatusCode.Unauthorized,
                HttpStatusCode.Forbidden,
                HttpStatusCode.BadRequest
            });
        }
    }
}
