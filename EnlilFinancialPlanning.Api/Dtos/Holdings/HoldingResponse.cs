namespace EnlilFinancialPlanning.Api.Dtos.Holdings;

public sealed record HoldingResponse(
    Guid UID,
    Guid LongTermContainerUID,
    string Name,
    string? Symbol,
    decimal Units,
    decimal PricePerUnit,
    decimal Value,
    DateOnly AsOfDate);
