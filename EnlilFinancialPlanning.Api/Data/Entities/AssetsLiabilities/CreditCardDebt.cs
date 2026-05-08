namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class CreditCardDebt
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public string? Institution { get; set; }
    public decimal APR { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal MinimumPayment { get; set; }
    public decimal CurrentBalance { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }

    public ICollection<CreditCardDebtSnapshot> Snapshots { get; set; } = new List<CreditCardDebtSnapshot>();
}
