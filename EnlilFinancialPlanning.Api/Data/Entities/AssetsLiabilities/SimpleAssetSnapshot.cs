namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class SimpleAssetSnapshot
{
    public Guid UID { get; set; }

    public Guid SimpleAssetUID { get; set; }
    public SimpleAsset SimpleAsset { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Value { get; set; }
}
