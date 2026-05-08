using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnlilFinancialPlanning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillingMonthToLineItemsAllocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "BillingMonth",
                table: "LineItemAllocations",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillingMonth",
                table: "LineItemAllocations");
        }
    }
}
