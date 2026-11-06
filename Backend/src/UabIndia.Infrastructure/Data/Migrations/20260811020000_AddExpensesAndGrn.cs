using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UabIndia.Infrastructure.Data;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260811020000_AddExpensesAndGrn")]
    public partial class AddExpensesAndGrn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260811020000_AddExpensesAndGrn.sql");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ExpenseClaims");
            migrationBuilder.DropTable(name: "GoodsReceiptNotes");
        }
    }
}
