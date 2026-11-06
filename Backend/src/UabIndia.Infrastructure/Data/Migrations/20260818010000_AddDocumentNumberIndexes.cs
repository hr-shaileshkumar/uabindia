using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UabIndia.Infrastructure.Data;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260818010000_AddDocumentNumberIndexes")]
    public partial class AddDocumentNumberIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260818010000_AddDocumentNumberIndexes.sql");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
