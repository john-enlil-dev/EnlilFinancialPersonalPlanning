namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class RetirementHolding
{
    public Guid UID { get; set; }

    public Guid RetirementContainerUID { get; set; }
    public RetirementContainer RetirementContainer { get; set; } = null!;

    public required string Name { get; set; }
    public string? Symbol { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
    public DateOnly AsOfDate { get; set; }

    public ICollection<RetirementHoldingSnapshot> Snapshots { get; set; } = new List<RetirementHoldingSnapshot>();
}
