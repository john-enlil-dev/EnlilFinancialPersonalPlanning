using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnlilFinancialPlanning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetsAndLiabilitiesToDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CreditCardDebts",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Institution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    APR = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    CreditLimit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumPayment = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditCardDebts", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "LineItemAllocations",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    LineItemUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LinkedEntityUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LinkedEntityType = table.Column<int>(type: "int", nullable: false),
                    ComponentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AffectsLinkedBalance = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineItemAllocations", x => x.UID);
                    table.ForeignKey(
                        name: "FK_LineItemAllocations_LineItems_LineItemUID",
                        column: x => x.LineItemUID,
                        principalTable: "LineItems",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LongTermContainers",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Institution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LongTermContainers", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "LongTermItems",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Subtype = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LongTermItems", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "MortgageDebts",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Institution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    OriginalPrincipal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    InterestRate = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    TermMonths = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    LoanType = table.Column<int>(type: "int", nullable: false),
                    MonthlyPaymentPI = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    EscrowMonthly = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PMIMonthly = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    LinkedRecurringTemplateUID = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CurrentBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MortgageDebts", x => x.UID);
                    table.ForeignKey(
                        name: "FK_MortgageDebts_RecurringTemplates_LinkedRecurringTemplateUID",
                        column: x => x.LinkedRecurringTemplateUID,
                        principalTable: "RecurringTemplates",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RetirementContainers",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Institution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AccountType = table.Column<int>(type: "int", nullable: false),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetirementContainers", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "Savings",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Institution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Subtype = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CompoundingFrequency = table.Column<int>(type: "int", nullable: false),
                    CurrentRate = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    CurrentRateAsOfDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentValueAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Savings", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "SimpleAssets",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Subtype = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentAsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimpleAssets", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "CreditCardDebtSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    CreditCardDebtUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditCardDebtSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_CreditCardDebtSnapshots_CreditCardDebts_CreditCardDebtUID",
                        column: x => x.CreditCardDebtUID,
                        principalTable: "CreditCardDebts",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Holdings",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    LongTermContainerUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Symbol = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Units = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    PricePerUnit = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    AsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holdings", x => x.UID);
                    table.ForeignKey(
                        name: "FK_Holdings_LongTermContainers_LongTermContainerUID",
                        column: x => x.LongTermContainerUID,
                        principalTable: "LongTermContainers",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LongTermItemSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    LongTermItemUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LongTermItemSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_LongTermItemSnapshots_LongTermItems_LongTermItemUID",
                        column: x => x.LongTermItemUID,
                        principalTable: "LongTermItems",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AmortizationEntries",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    MortgageDebtUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentNumber = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Principal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Interest = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RemainingBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmortizationEntries", x => x.UID);
                    table.ForeignKey(
                        name: "FK_AmortizationEntries_MortgageDebts_MortgageDebtUID",
                        column: x => x.MortgageDebtUID,
                        principalTable: "MortgageDebts",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MortgageDebtSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    MortgageDebtUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MortgageDebtSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_MortgageDebtSnapshots_MortgageDebts_MortgageDebtUID",
                        column: x => x.MortgageDebtUID,
                        principalTable: "MortgageDebts",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetirementHoldings",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    RetirementContainerUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Symbol = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Units = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    PricePerUnit = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    AsOfDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetirementHoldings", x => x.UID);
                    table.ForeignKey(
                        name: "FK_RetirementHoldings_RetirementContainers_RetirementContainerUID",
                        column: x => x.RetirementContainerUID,
                        principalTable: "RetirementContainers",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavingsRateSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    SavingsUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsRateSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_SavingsRateSnapshots_Savings_SavingsUID",
                        column: x => x.SavingsUID,
                        principalTable: "Savings",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavingsValueSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    SavingsUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsValueSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_SavingsValueSnapshots_Savings_SavingsUID",
                        column: x => x.SavingsUID,
                        principalTable: "Savings",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimpleAssetSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    SimpleAssetUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimpleAssetSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_SimpleAssetSnapshots_SimpleAssets_SimpleAssetUID",
                        column: x => x.SimpleAssetUID,
                        principalTable: "SimpleAssets",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HoldingSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    HoldingUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Units = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    PricePerUnit = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoldingSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_HoldingSnapshots_Holdings_HoldingUID",
                        column: x => x.HoldingUID,
                        principalTable: "Holdings",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RetirementHoldingSnapshots",
                columns: table => new
                {
                    UID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    RetirementHoldingUID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Units = table.Column<decimal>(type: "decimal(18,6)", precision: 18, scale: 6, nullable: false),
                    PricePerUnit = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RetirementHoldingSnapshots", x => x.UID);
                    table.ForeignKey(
                        name: "FK_RetirementHoldingSnapshots_RetirementHoldings_RetirementHoldingUID",
                        column: x => x.RetirementHoldingUID,
                        principalTable: "RetirementHoldings",
                        principalColumn: "UID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AmortizationEntries_MortgageDebtUID_PaymentNumber",
                table: "AmortizationEntries",
                columns: new[] { "MortgageDebtUID", "PaymentNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditCardDebtSnapshots_CreditCardDebtUID_Date",
                table: "CreditCardDebtSnapshots",
                columns: new[] { "CreditCardDebtUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_LongTermContainerUID",
                table: "Holdings",
                column: "LongTermContainerUID");

            migrationBuilder.CreateIndex(
                name: "IX_HoldingSnapshots_HoldingUID_Date",
                table: "HoldingSnapshots",
                columns: new[] { "HoldingUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_LineItemAllocations_LineItemUID",
                table: "LineItemAllocations",
                column: "LineItemUID");

            migrationBuilder.CreateIndex(
                name: "IX_LineItemAllocations_LinkedEntityType_LinkedEntityUID",
                table: "LineItemAllocations",
                columns: new[] { "LinkedEntityType", "LinkedEntityUID" });

            migrationBuilder.CreateIndex(
                name: "IX_LongTermItemSnapshots_LongTermItemUID_Date",
                table: "LongTermItemSnapshots",
                columns: new[] { "LongTermItemUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_MortgageDebts_LinkedRecurringTemplateUID",
                table: "MortgageDebts",
                column: "LinkedRecurringTemplateUID");

            migrationBuilder.CreateIndex(
                name: "IX_MortgageDebtSnapshots_MortgageDebtUID_Date",
                table: "MortgageDebtSnapshots",
                columns: new[] { "MortgageDebtUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_RetirementHoldings_RetirementContainerUID",
                table: "RetirementHoldings",
                column: "RetirementContainerUID");

            migrationBuilder.CreateIndex(
                name: "IX_RetirementHoldingSnapshots_RetirementHoldingUID_Date",
                table: "RetirementHoldingSnapshots",
                columns: new[] { "RetirementHoldingUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_SavingsRateSnapshots_SavingsUID_Date",
                table: "SavingsRateSnapshots",
                columns: new[] { "SavingsUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_SavingsValueSnapshots_SavingsUID_Date",
                table: "SavingsValueSnapshots",
                columns: new[] { "SavingsUID", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_SimpleAssetSnapshots_SimpleAssetUID_Date",
                table: "SimpleAssetSnapshots",
                columns: new[] { "SimpleAssetUID", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AmortizationEntries");

            migrationBuilder.DropTable(
                name: "CreditCardDebtSnapshots");

            migrationBuilder.DropTable(
                name: "HoldingSnapshots");

            migrationBuilder.DropTable(
                name: "LineItemAllocations");

            migrationBuilder.DropTable(
                name: "LongTermItemSnapshots");

            migrationBuilder.DropTable(
                name: "MortgageDebtSnapshots");

            migrationBuilder.DropTable(
                name: "RetirementHoldingSnapshots");

            migrationBuilder.DropTable(
                name: "SavingsRateSnapshots");

            migrationBuilder.DropTable(
                name: "SavingsValueSnapshots");

            migrationBuilder.DropTable(
                name: "SimpleAssetSnapshots");

            migrationBuilder.DropTable(
                name: "CreditCardDebts");

            migrationBuilder.DropTable(
                name: "Holdings");

            migrationBuilder.DropTable(
                name: "LongTermItems");

            migrationBuilder.DropTable(
                name: "MortgageDebts");

            migrationBuilder.DropTable(
                name: "RetirementHoldings");

            migrationBuilder.DropTable(
                name: "Savings");

            migrationBuilder.DropTable(
                name: "SimpleAssets");

            migrationBuilder.DropTable(
                name: "LongTermContainers");

            migrationBuilder.DropTable(
                name: "RetirementContainers");
        }
    }
}
