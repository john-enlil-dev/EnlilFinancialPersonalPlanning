namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class HoldingSnapshot
{
    public Guid UID { get; set; }

    public Guid HoldingUID { get; set; }
    public Holding Holding { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
}
