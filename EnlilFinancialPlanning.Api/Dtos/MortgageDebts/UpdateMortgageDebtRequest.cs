using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.MortgageDebts;

public sealed class UpdateMortgageDebtRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public decimal OriginalPrincipal { get; set; }
    public decimal InterestRate { get; set; }
    public int TermMonths { get; set; }
    public DateOnly StartDate { get; set; }
    public LoanType LoanType { get; set; }
    public decimal MonthlyPaymentPI { get; set; }
    public decimal EscrowMonthly { get; set; }
    public decimal PMIMonthly { get; set; }
    public Guid? LinkedRecurringTemplateUID { get; set; }
    public decimal CurrentBalance { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }
}
