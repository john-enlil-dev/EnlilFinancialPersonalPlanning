using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnlilFinancialPlanning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditCardBalanceAnchors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CreditCardBalanceAnchors",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    CreditCardDebtUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    AssertedBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AdjustmentAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsOpening = table.Column<bool>(type: "bit", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AdjustmentLineItemUID = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditCardBalanceAnchors", x => x.UID);
                    table.ForeignKey(
                        name: "FK_CreditCardBalanceAnchors_CreditCardDebts_CreditCardDebtUID",
                        column: x => x.CreditCardDebtUID,
                        principalTable: "CreditCardDebts",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CreditCardBalanceAnchors_CreditCardDebtUID_Date",
                table: "CreditCardBalanceAnchors",
                columns: new[] { "CreditCardDebtUID", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CreditCardBalanceAnchors");
        }
    }
}
