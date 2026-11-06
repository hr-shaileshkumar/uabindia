using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UabIndia.Infrastructure.Data;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260901000000_AddMultiTenantCompositeIndexes")]
    public partial class AddMultiTenantCompositeIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260901_AddMultiTenantCompositeIndexes.sql");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
