namespace EnlilFinancialPlanning.Api.Dtos.SimpleAssets;

public sealed class UpdateSimpleAssetRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Subtype { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }
}
