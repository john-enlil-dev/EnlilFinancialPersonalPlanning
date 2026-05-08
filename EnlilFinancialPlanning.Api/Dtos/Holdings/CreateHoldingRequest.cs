namespace EnlilFinancialPlanning.Api.Dtos.Holdings;

public sealed class CreateHoldingRequest
{
    public Guid LongTermContainerUID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public decimal Units { get; set; }
    public decimal PricePerUnit { get; set; }
    public DateOnly AsOfDate { get; set; }
}
