using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class RetirementContainer
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public string? Institution { get; set; }
    public AccountType AccountType { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }

    public ICollection<RetirementHolding> Holdings { get; set; } = new List<RetirementHolding>();
}
