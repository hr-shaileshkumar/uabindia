using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System.IO;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();

            // locate appsettings.Development.json in Api project
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "UabIndia.Api");
            var config = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var conn = NormalizeSqlServerConnectionString(
                config.GetConnectionString("DefaultConnection") ?? "Server=(localdb)\\MSSQLLocalDB;Database=UabIndia_HRMS;Trusted_Connection=True;");
            builder.UseSqlServer(conn);
            builder.ReplaceService<IModelCacheKeyFactory, TenantModelCacheKeyFactory>();

            var tenantAccessor = new Services.TenantAccessor();
            var schema = System.Environment.GetEnvironmentVariable("TENANT_SCHEMA");
            if (!string.IsNullOrWhiteSpace(schema))
            {
                tenantAccessor.SetTenantSchema(schema);
            }

            var tenantIdRaw = System.Environment.GetEnvironmentVariable("TENANT_ID");
            if (System.Guid.TryParse(tenantIdRaw, out var tenantId))
            {
                tenantAccessor.SetTenantId(tenantId);
            }

            return new ApplicationDbContext(builder.Options, tenantAccessor, new DummyEncryptionService());
        }

        private static string NormalizeSqlServerConnectionString(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return connectionString;
            }

            var builder = new SqlConnectionStringBuilder(connectionString)
            {
                TrustServerCertificate = true
            };

            return builder.ConnectionString;
        }
    }

    // Dummy encryption service for design-time migrations
    public class DummyEncryptionService : IEncryptionService
    {
        public string Encrypt(string plainText) => plainText;
        public string Decrypt(string cipherText) => cipherText;
    }
}
