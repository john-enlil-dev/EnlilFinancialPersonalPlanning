namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class RetirementHoldingSnapshot
{
    public Guid UID { get; set; }

    public Guid RetirementHoldingUID { get; set; }
    public RetirementHolding RetirementHolding { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
}
