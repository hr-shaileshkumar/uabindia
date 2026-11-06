using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    public partial class AddTenantProvisionLogsAndTenantSoftDeleteMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TenantProvisionLogs",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StepName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CorrelationId = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantProvisionLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TenantProvisionLogs_TenantId_CreatedAt",
                schema: "dbo",
                table: "TenantProvisionLogs",
                columns: new[] { "TenantId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TenantProvisionLogs_CorrelationId",
                schema: "dbo",
                table: "TenantProvisionLogs",
                column: "CorrelationId");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                schema: "dbo",
                table: "Tenants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                schema: "dbo",
                table: "Tenants",
                type: "uniqueidentifier",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TenantProvisionLogs",
                schema: "dbo");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                schema: "dbo",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                schema: "dbo",
                table: "Tenants");
        }
    }
}
