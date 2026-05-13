using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnlilFinancialPlanning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsLineItemCashToSavings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCashMovement",
                table: "LineItems",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCashMovement",
                table: "LineItems");
        }
    }
}
