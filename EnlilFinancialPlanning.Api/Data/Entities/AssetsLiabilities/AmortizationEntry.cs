namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class AmortizationEntry
{
    public Guid UID { get; set; }

    public Guid MortgageDebtUID { get; set; }
    public MortgageDebt MortgageDebt { get; set; } = null!;

    public int PaymentNumber { get; set; }
    public DateOnly Date { get; set; }
    public decimal Principal { get; set; }
    public decimal Interest { get; set; }
    public decimal RemainingBalance { get; set; }
}
