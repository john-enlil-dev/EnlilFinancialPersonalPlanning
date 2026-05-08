namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class LongTermItemSnapshot
{
    public Guid UID { get; set; }

    public Guid LongTermItemUID { get; set; }
    public LongTermItem LongTermItem { get; set; } = null!;

    public DateOnly Date { get; set; }
    public decimal Value { get; set; }
}
