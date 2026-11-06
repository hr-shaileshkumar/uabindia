using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerIndexesAndTenantCustomDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomDomain",
                schema: "dbo",
                table: "TenantConfigs",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CustomerCode",
                table: "Customers",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_TenantConfigs_CustomDomain",
                schema: "dbo",
                table: "TenantConfigs",
                column: "CustomDomain",
                filter: "[CustomDomain] IS NOT NULL AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_TenantId",
                table: "Customers",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_TenantId_CustomerCode",
                table: "Customers",
                columns: new[] { "TenantId", "CustomerCode" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.Sql("""
                UPDATE [dbo].[TenantConfigs]
                SET [CustomDomain] = LOWER(LTRIM(RTRIM(JSON_VALUE([ConfigJson], '$.tenantProfile.customDomain'))))
                WHERE [IsDeleted] = 0
                  AND JSON_VALUE([ConfigJson], '$.tenantProfile.customDomain') IS NOT NULL
                  AND LTRIM(RTRIM(JSON_VALUE([ConfigJson], '$.tenantProfile.customDomain'))) <> '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TenantConfigs_CustomDomain",
                schema: "dbo",
                table: "TenantConfigs");

            migrationBuilder.DropIndex(
                name: "IX_Customers_TenantId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_TenantId_CustomerCode",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CustomDomain",
                schema: "dbo",
                table: "TenantConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "CustomerCode",
                table: "Customers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
