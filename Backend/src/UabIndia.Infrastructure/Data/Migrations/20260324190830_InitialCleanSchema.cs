using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// Applies the full ERP schema idempotently via SQL so re-runs and partially migrated
    /// databases do not fail on objects already created by earlier migrations
    /// (for example ContactSubmissions, LeavePolicyRules, or BaseEntity).
    /// </remarks>
    public partial class InitialCleanSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "dbo");
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260324190830_InitialCleanSchema.sql");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — schema is owned collectively by the migration chain.
        }
    }
}
