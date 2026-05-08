namespace EnlilFinancialPlanning.Api.Dtos.LongTermItems;

public sealed record LongTermItemResponse(
    Guid UID,
    string Name,
    string? Subtype,
    decimal CurrentValue,
    DateOnly CurrentAsOfDate);
