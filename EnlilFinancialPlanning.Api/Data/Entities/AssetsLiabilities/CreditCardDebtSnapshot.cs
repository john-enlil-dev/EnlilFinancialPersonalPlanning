namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class CreditCardDebtSnapshot
{
    public Guid UID { get; set; }

    public Guid CreditCardDebtUID { get; set; }
    public CreditCardDebt CreditCardDebt { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Balance { get; set; }
}
