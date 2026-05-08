namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class LongTermContainer
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public string? Institution { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }

    public ICollection<Holding> Holdings { get; set; } = new List<Holding>();
}
