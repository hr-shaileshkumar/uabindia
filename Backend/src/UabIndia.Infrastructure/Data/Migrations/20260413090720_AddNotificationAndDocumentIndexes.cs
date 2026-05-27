using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationAndDocumentIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "NotificationMessages",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Module",
                table: "DocumentRecords",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "DocumentRecords",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMessages_Tenant_Recipient_Status",
                table: "NotificationMessages",
                columns: new[] { "TenantId", "RecipientUserId", "Status", "IsRead", "CreatedAt" },
                descending: new[] { false, false, false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentRecords_Tenant_Company_Project",
                table: "DocumentRecords",
                columns: new[] { "TenantId", "CompanyId", "ProjectId", "CreatedAt" },
                descending: new[] { false, false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentRecords_Tenant_Module_Category",
                table: "DocumentRecords",
                columns: new[] { "TenantId", "Module", "Category", "CreatedAt" },
                descending: new[] { false, false, false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationMessages_Tenant_Recipient_Status",
                table: "NotificationMessages");

            migrationBuilder.DropIndex(
                name: "IX_DocumentRecords_Tenant_Company_Project",
                table: "DocumentRecords");

            migrationBuilder.DropIndex(
                name: "IX_DocumentRecords_Tenant_Module_Category",
                table: "DocumentRecords");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "NotificationMessages",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Module",
                table: "DocumentRecords",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "DocumentRecords",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
