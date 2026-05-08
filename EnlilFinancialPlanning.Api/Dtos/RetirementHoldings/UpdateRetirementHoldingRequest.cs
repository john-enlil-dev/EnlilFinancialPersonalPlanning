namespace EnlilFinancialPlanning.Api.Dtos.RetirementHoldings;

public sealed class UpdateRetirementHoldingRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
    public DateOnly AsOfDate { get; set; }
}
