using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class Savings
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public string? Institution { get; set; }
    public string? Subtype { get; set; }
    public CompoundingFrequency CompoundingFrequency { get; set; }
    public decimal CurrentRate { get; set; }
    public DateOnly CurrentRateAsOfDate { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentValueAsOfDate { get; set; }

    public ICollection<SavingsValueSnapshot> ValueSnapshots { get; set; } = new List<SavingsValueSnapshot>();
    public ICollection<SavingsRateSnapshot> RateSnapshots { get; set; } = new List<SavingsRateSnapshot>();
}
