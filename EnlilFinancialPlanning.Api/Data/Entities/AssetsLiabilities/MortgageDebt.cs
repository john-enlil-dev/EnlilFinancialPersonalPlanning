using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class MortgageDebt
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
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
    public RecurringTemplate? LinkedRecurringTemplate { get; set; }

    public decimal CurrentBalance { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }

    public ICollection<MortgageDebtSnapshot> Snapshots { get; set; } = new List<MortgageDebtSnapshot>();
    public ICollection<AmortizationEntry> AmortizationSchedule { get; set; } = new List<AmortizationEntry>();
}
