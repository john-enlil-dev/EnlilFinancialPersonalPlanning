namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class MortgageDebtSnapshot
{
    public Guid UID { get; set; }

    public Guid MortgageDebtUID { get; set; }
    public MortgageDebt MortgageDebt { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Balance { get; set; }
}
