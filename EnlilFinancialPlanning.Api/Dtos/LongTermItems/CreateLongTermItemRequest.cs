namespace EnlilFinancialPlanning.Api.Dtos.LongTermItems;

public sealed class CreateLongTermItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Subtype { get; set; }
    public decimal CurrentValue { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }
}
