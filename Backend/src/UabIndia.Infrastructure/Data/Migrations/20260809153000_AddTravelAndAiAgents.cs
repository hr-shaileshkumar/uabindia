using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTravelAndAiAgents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            MigrationSqlHelper.ExecuteSqlFile(migrationBuilder, "20260809153000_AddTravelAndAiAgents.sql");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TravelRequests");
            migrationBuilder.DropTable(name: "AiAgents");
        }
    }
}
