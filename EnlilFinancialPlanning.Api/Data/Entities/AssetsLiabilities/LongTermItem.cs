namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class LongTermItem
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public string? Subtype { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }

    public ICollection<LongTermItemSnapshot> Snapshots { get; set; } = new List<LongTermItemSnapshot>();
}
