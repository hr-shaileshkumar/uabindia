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

            builder.ConfigureAppConfiguration((context, config) =>
            {
                var overrides = new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "test_jwt_key_1234567890",
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
        [InlineData("/api/v1/payroll/structures")]
        [InlineData("/api/v1/reports/hr/headcount")]
        [InlineData("/api/v1/reports/payroll/summary")]
        [InlineData("/api/v1/reports/compliance/pf")]
        [InlineData("/api/v1/crm/customers")]
        [InlineData("/api/v1/admin/settings")]
        [InlineData("/api/v1/training/assessments")]
        [InlineData("/api/v1/training/certificates")]
        [InlineData("/api/v1/companies")]
        public async Task ProtectedEndpoints_RequireAuth(string url)
        {
            var response = await _client.GetAsync(url);
            Assert.Contains(response.StatusCode, new[]
            {
                HttpStatusCode.Unauthorized,
                HttpStatusCode.Forbidden,
                HttpStatusCode.BadRequest
            });
        }
    }
}
