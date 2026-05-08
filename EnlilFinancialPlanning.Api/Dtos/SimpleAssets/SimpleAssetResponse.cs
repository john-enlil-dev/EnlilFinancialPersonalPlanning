namespace EnlilFinancialPlanning.Api.Dtos.SimpleAssets;

public sealed record SimpleAssetResponse(
    Guid UID,
    string Name,
    string? Subtype,
    decimal CurrentValue,
    DateOnly CurrentAsOfDate);
