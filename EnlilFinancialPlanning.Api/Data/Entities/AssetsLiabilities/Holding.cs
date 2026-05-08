namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class Holding
{
    public Guid UID { get; set; }

    public Guid LongTermContainerUID { get; set; }
    public LongTermContainer LongTermContainer { get; set; } = null!;

    public required string Name { get; set; }
    public string? Symbol { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
    public DateOnly AsOfDate { get; set; }

    public ICollection<HoldingSnapshot> Snapshots { get; set; } = new List<HoldingSnapshot>();
}
