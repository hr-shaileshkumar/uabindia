using System;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace UabIndia.Api.Swagger
{
    public static class SwaggerConfigurationExtensions
    {
        public static IServiceCollection AddEnterpriseSwagger(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "UabIndia Enterprise Cloud ERP & SaaS API",
                    Version = "v1",
                    Description = @"### UabIndia Enterprise Cloud ERP & SaaS Platform
Enterprise-grade REST APIs for Finance, HRMS, Payroll, Supply Chain, CRM, Statutory Compliance (GST, TDS, EPF, ESIC, PT), and Platform Multi-Tenancy.

#### Multi-Tenancy & Scope Headers:
- **`X-Tenant-Id`**: Tenant subdomain (e.g. `acme`) or Tenant GUID.
- **`X-Company-Id`**: Active subsidiary/company scope GUID.
- **`X-Project-Id`**: Active project/work order scope GUID.

#### Authentication:
All protected routes require standard `Authorization: Bearer <JWT_ACCESS_TOKEN>`.",
                    Contact = new OpenApiContact
                    {
                        Name = "UabIndia Platform Engineering",
                        Email = "platform@uabindia.com",
                        Url = new Uri("https://uabindia.com")
                    },
                    License = new OpenApiLicense
                    {
                        Name = "Proprietary Enterprise License",
                        Url = new Uri("https://uabindia.com/terms")
                    }
                });

                // JWT Bearer Security Definition
                var securityScheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "Enter your JWT Bearer token in the format: `Bearer {token}`",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Reference = new OpenApiReference
                    {
                        Id = "Bearer",
                        Type = ReferenceType.SecurityScheme
                    }
                };

                c.AddSecurityDefinition("Bearer", securityScheme);

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    { securityScheme, Array.Empty<string>() }
                });

                // Multi-Tenant Header Injection Filter
                c.OperationFilter<TenantHeaderOperationFilter>();

                // Include XML Comments if available
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    c.IncludeXmlComments(xmlPath);
                }
            });

            return services;
        }

        public static IApplicationBuilder UseEnterpriseSwagger(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseSwagger(c =>
            {
                c.RouteTemplate = "swagger/{documentName}/swagger.json";
            });

            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "UabIndia Enterprise API v1");
                c.RoutePrefix = "swagger";
                c.DocumentTitle = "UabIndia Enterprise API Portal";
                c.DocExpansion(DocExpansion.None);
                c.DisplayRequestDuration();
                c.EnablePersistAuthorization();
                c.EnableDeepLinking();
                c.DefaultModelsExpandDepth(-1); // Clean UI without sprawling model schemas at bottom
            });

            return app;
        }
    }
}
