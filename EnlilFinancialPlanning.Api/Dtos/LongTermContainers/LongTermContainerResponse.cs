namespace EnlilFinancialPlanning.Api.Dtos.LongTermContainers;

public sealed record LongTermContainerResponse(
    Guid UID,
    string Name,
    string? Institution,
    decimal CurrentValue,
    DateOnly CurrentAsOfDate);
