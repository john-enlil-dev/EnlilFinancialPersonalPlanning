using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.Savings;

public sealed class CreateSavingsRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Subtype { get; set; }
    public CompoundingFrequency CompoundingFrequency { get; set; }
    public decimal CurrentRate { get; set; }
    public DateOnly CurrentRateAsOfDate { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentValueAsOfDate { get; set; }
}
