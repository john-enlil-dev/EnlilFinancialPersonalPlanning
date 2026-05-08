namespace EnlilFinancialPlanning.Api.Dtos.RetirementHoldings;

public sealed record RetirementHoldingResponse(
    Guid UID,
    Guid RetirementContainerUID,
    string Name,
    string? Symbol,
    decimal Units,
    decimal PricePerUnit,
    decimal Value,
    DateOnly AsOfDate);
