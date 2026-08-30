using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Teleprompt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ScriptPeopleMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByName",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EditorId",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EditorName",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Folder",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPlaceholder",
                table: "Scripts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Lesson",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PresenterIdsJson",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerId",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerName",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subfolder",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideomakerId",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideomakerName",
                table: "Scripts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByName",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "EditorId",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "EditorName",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "Folder",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "IsPlaceholder",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "Lesson",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "PresenterIdsJson",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "ReviewerId",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "ReviewerName",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "Subfolder",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "VideomakerId",
                table: "Scripts");

            migrationBuilder.DropColumn(
                name: "VideomakerName",
                table: "Scripts");
        }
    }
}
