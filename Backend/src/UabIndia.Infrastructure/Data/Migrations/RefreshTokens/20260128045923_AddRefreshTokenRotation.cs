using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations.RefreshTokens
{
    /// <inheritdoc />
    public partial class AddRefreshTokenRotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Longitude",
                table: "BaseEntity",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Latitude",
                table: "BaseEntity",
                type: "decimal(10,7)",
                precision: 10,
                scale: 7,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceId",
                table: "BaseEntity",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "BaseEntity",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GeoValidated",
                table: "BaseEntity",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ManagerId",
                table: "BaseEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentTokenId",
                table: "BaseEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "BaseEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefreshToken_DeviceId",
                table: "BaseEntity",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReplacedByTokenId",
                table: "BaseEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RequestedBy",
                table: "BaseEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RevokedAt",
                table: "BaseEntity",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "User_FullName",
                table: "BaseEntity",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeviceId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "EmployeeCode",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "GeoValidated",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "ParentTokenId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "RefreshToken_DeviceId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "ReplacedByTokenId",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "RequestedBy",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "RevokedAt",
                table: "BaseEntity");

            migrationBuilder.DropColumn(
                name: "User_FullName",
                table: "BaseEntity");

            migrationBuilder.AlterColumn<decimal>(
                name: "Longitude",
                table: "BaseEntity",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,7)",
                oldPrecision: 10,
                oldScale: 7,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Latitude",
                table: "BaseEntity",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,7)",
                oldPrecision: 10,
                oldScale: 7,
                oldNullable: true);
        }
    }
}
