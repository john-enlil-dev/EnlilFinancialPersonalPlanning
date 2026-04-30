using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnlilFinancialPlanning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMassiveMigrationForFinancialSystemSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "RecurringTemplates",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    CategoryUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Cadence = table.Column<int>(type: "int", nullable: false),
                    DayOfMonth = table.Column<int>(type: "int", nullable: true),
                    UseLastDayOfMonth = table.Column<bool>(type: "bit", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: true),
                    MonthOfQuarter = table.Column<int>(type: "int", nullable: true),
                    MonthOfYear = table.Column<int>(type: "int", nullable: true),
                    IntervalDays = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringTemplates", x => x.UID);
                    table.ForeignKey(
                        name: "FK_RecurringTemplates_Categories_CategoryUID",
                        column: x => x.CategoryUID,
                        principalTable: "Categories",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LineItems",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CategoryUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceTemplateUID = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WasManuallyEdited = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineItems", x => x.UID);
                    table.ForeignKey(
                        name: "FK_LineItems_Categories_CategoryUID",
                        column: x => x.CategoryUID,
                        principalTable: "Categories",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LineItems_RecurringTemplates_SourceTemplateUID",
                        column: x => x.SourceTemplateUID,
                        principalTable: "RecurringTemplates",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LineItems_CategoryUID",
                table: "LineItems",
                column: "CategoryUID");

            migrationBuilder.CreateIndex(
                name: "IX_LineItems_Date",
                table: "LineItems",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_LineItems_SourceTemplateUID",
                table: "LineItems",
                column: "SourceTemplateUID");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTemplates_CategoryUID",
                table: "RecurringTemplates",
                column: "CategoryUID");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTemplates_StartDate",
                table: "RecurringTemplates",
                column: "StartDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LineItems");

            migrationBuilder.DropTable(
                name: "RecurringTemplates");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
