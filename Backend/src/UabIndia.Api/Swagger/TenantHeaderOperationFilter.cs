using System.Collections.Generic;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace UabIndia.Api.Swagger
{
    /// <summary>
    /// Swashbuckle Operation Filter that injects multi-tenant and organizational scope headers into OpenAPI operations.
    /// </summary>
    public class TenantHeaderOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            operation.Parameters ??= new List<OpenApiParameter>();

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-Tenant-Id",
                In = ParameterLocation.Header,
                Description = "Multi-Tenant Context: Tenant Subdomain (e.g., 'acme') or Tenant GUID",
                Required = false,
                Schema = new OpenApiSchema
                {
                    Type = "string"
                }
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-Company-Id",
                In = ParameterLocation.Header,
                Description = "Organization Scope: Active Company GUID for multi-entity filtering",
                Required = false,
                Schema = new OpenApiSchema
                {
                    Type = "string",
                    Format = "uuid"
                }
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-Project-Id",
                In = ParameterLocation.Header,
                Description = "Project Scope: Active Project GUID for cost center/work order allocation",
                Required = false,
                Schema = new OpenApiSchema
                {
                    Type = "string",
                    Format = "uuid"
                }
            });
        }
    }
}
