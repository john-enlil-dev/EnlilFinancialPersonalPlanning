using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.Savings;

public sealed record SavingsResponse(
    Guid UID,
    string Name,
    string? Institution,
    string? Subtype,
    CompoundingFrequency CompoundingFrequency,
    decimal CurrentRate,
    DateOnly CurrentRateAsOfDate,
    decimal CurrentValue,
    DateOnly CurrentValueAsOfDate);
