using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using UabIndia.Api.Swagger;
using Xunit;

namespace UabIndia.Tests
{
    public class SwaggerConfigurationTests
    {
        [Fact]
        public void TenantHeaderOperationFilter_AppliesTenantAndScopeHeaders()
        {
            var filter = new TenantHeaderOperationFilter();
            var operation = new OpenApiOperation
            {
                Parameters = new List<OpenApiParameter>()
            };

            filter.Apply(operation, null!);

            Assert.Equal(3, operation.Parameters.Count);

            var tenantParam = operation.Parameters.FirstOrDefault(p => p.Name == "X-Tenant-Id");
            Assert.NotNull(tenantParam);
            Assert.Equal(ParameterLocation.Header, tenantParam.In);
            Assert.False(tenantParam.Required);

            var companyParam = operation.Parameters.FirstOrDefault(p => p.Name == "X-Company-Id");
            Assert.NotNull(companyParam);
            Assert.Equal(ParameterLocation.Header, companyParam.In);
            Assert.Equal("uuid", companyParam.Schema.Format);

            var projectParam = operation.Parameters.FirstOrDefault(p => p.Name == "X-Project-Id");
            Assert.NotNull(projectParam);
            Assert.Equal(ParameterLocation.Header, projectParam.In);
            Assert.Equal("uuid", projectParam.Schema.Format);
        }

        [Fact]
        public void AddEnterpriseSwagger_RegistersSwaggerGeneratorAndExplorers()
        {
            var services = new ServiceCollection();
            services.AddEnterpriseSwagger();

            var provider = services.BuildServiceProvider();
            var options = provider.GetService<IOptions<SwaggerGenOptions>>();

            Assert.NotNull(options);
            Assert.NotNull(options.Value);
            Assert.Contains("v1", options.Value.SwaggerGeneratorOptions.SwaggerDocs.Keys);
        }
    }
}
