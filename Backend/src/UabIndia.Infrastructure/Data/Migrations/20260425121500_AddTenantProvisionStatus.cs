using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantProvisionStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProvisionStatus",
                schema: "dbo",
                table: "Tenants",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.Sql(@"
UPDATE [dbo].[Tenants]
SET [ProvisionStatus] = CASE
    WHEN [IsDeleted] = 1 THEN 'Failed'
    WHEN [IsActive] = 1 THEN 'Completed'
    ELSE 'Pending'
END
WHERE [ProvisionStatus] IS NULL OR LTRIM(RTRIM([ProvisionStatus])) = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProvisionStatus",
                schema: "dbo",
                table: "Tenants");
        }
    }
}
