namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class SavingsRateSnapshot
{
    public Guid UID { get; set; }

    public Guid SavingsUID { get; set; }
    public Savings Savings { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Rate { get; set; }
}
