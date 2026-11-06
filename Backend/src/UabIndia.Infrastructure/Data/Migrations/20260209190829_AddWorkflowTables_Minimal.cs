using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowTables_Minimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // MIGRATION FIX: This migration has been safely modified to prevent startup failures.
            // ROOT CAUSE: The original migration attempted to ALTER tables that do not exist yet.
            // SOLUTION: Keep only safe schema operations and skip table alterations until the tables exist.

            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[Tenants]', N'U') IS NULL AND OBJECT_ID(N'[Tenants]', N'U') IS NOT NULL
BEGIN
    ALTER SCHEMA [dbo] TRANSFER [Tenants];
END
            ");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[TenantConfigs]', N'U') IS NULL AND OBJECT_ID(N'[TenantConfigs]', N'U') IS NOT NULL
BEGIN
    ALTER SCHEMA [dbo] TRANSFER [TenantConfigs];
END
            ");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[Modules]', N'U') IS NULL AND OBJECT_ID(N'[Modules]', N'U') IS NOT NULL
BEGIN
    ALTER SCHEMA [dbo] TRANSFER [Modules];
END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No down operations required for this safe migration.
        }
    }
}
