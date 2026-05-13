namespace EnlilFinancialPlanning.Api.Dtos.LineItems;

public sealed record LineItemLinkage(
    string EntityType,
    string EntityName,
    string? ComponentType,
    decimal Amount);
