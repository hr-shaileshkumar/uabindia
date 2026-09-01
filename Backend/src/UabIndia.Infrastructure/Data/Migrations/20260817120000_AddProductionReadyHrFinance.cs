using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UabIndia.Infrastructure.Data;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260817120000_AddProductionReadyHrFinance")]
    public partial class AddProductionReadyHrFinance : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260817120000_AddProductionReadyHrFinance.sql");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
